using EquipAI.Application.Telemetry;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Telemetry;

/// <summary>
/// 遥测清理后台服务的停机语义测试。
///
/// 清理任务由 <see cref="EquipAI.Application.Hosting.LockedTimerService"/> 调度，取消信号必须从数据库
/// 查询传播到基类；如果服务把 OperationCanceledException 当成普通故障吞掉，应用停机时会继续遍历租户，
/// 延长容器退出并可能持有分布式锁直到超时。
/// </summary>
public sealed class TelemetryCleanupServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task CleanupAsync_停机取消不能被异常兜底吞掉()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var service = new TelemetryCleanupService(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            new AlwaysAcquireLockProvider(),
            _serviceProvider.GetRequiredService<ILogger<TelemetryCleanupService>>());

        var act = () => service.CleanupAsync(cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>(
            "后台清理必须把停机信号交给 LockedTimerService，而不是误报为成功完成");
    }

    /// <summary>复刻无 HTTP 上下文时的后台租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
