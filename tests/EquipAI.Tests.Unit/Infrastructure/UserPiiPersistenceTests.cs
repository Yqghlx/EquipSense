using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 用户联系方式在 EF 持久化边界的加密和盲索引测试。
/// </summary>
public sealed class UserPiiPersistenceTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        var protector = new PiiProtector(BuildConfiguration());
        _db = new AppDbContext(options, new TestTenantContext(_tenantId), protector);

        await _db.Database.EnsureCreatedAsync();
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "PII 测试租户",
            Slug = $"pii-{Guid.NewGuid():N}",
            Plan = TenantPlan.Basic,
            MaxUsers = 20,
            MaxDevices = 20,
            CurrentUserCount = 0,
            CurrentDeviceCount = 0
        });
        await _db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task 保存用户时联系方式应以密文和盲索引落库()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Username = $"pii-{Guid.NewGuid():N}",
            PasswordHash = "hash",
            Email = "User@Example.com",
            Phone = "+86 (138)-0011-2233",
            Role = UserRole.Viewer
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var stored = await ReadStoredUserAsync(user.Id);
        stored.Email.Should().StartWith("enc:v1:").And.NotContain("User@Example.com");
        stored.Phone.Should().StartWith("enc:v1:").And.NotContain("+86 (138)-0011-2233");
        user.EmailLookupHash.Should().Be(
            new PiiProtector(BuildConfiguration()).CreateLookupHash("email", user.Email));
        user.PhoneLookupHash.Should().Be(
            new PiiProtector(BuildConfiguration()).CreateLookupHash("phone", user.Phone));

        var reloaded = await _db.Users.SingleAsync(item => item.Id == user.Id);
        reloaded.Email.Should().Be("User@Example.com");
        reloaded.Phone.Should().Be("+86 (138)-0011-2233");
    }

    [Fact]
    public void 用户邮箱列应容纳最大合法邮箱的加密密文()
    {
        var email = BuildMaximumLengthEmail();
        var protector = new PiiProtector(BuildConfiguration());
        var encryptedEmail = protector.Protect(email)!;
        var emailProperty = _db.Model.FindEntityType(typeof(User))!
            .FindProperty(nameof(User.Email))!;

        emailProperty.GetMaxLength()
            .Should().BeGreaterThanOrEqualTo(encryptedEmail.Length);
    }

    [Fact]
    public void 用户名索引应为全局唯一()
    {
        var indexes = _db.Model.FindEntityType(typeof(User))!
            .GetIndexes()
            .Where(index => index.Properties.Count == 1
                && index.Properties[0].Name == nameof(User.Username))
            .ToList();

        indexes.Should().ContainSingle();
        indexes[0].IsUnique.Should().BeTrue();
    }

    [Fact]
    public async Task 清空联系方式时应同步清空盲索引()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Username = $"pii-{Guid.NewGuid():N}",
            PasswordHash = "hash",
            Email = "clear@example.com",
            Phone = "13800138000",
            Role = UserRole.Viewer
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        user.Email = null;
        user.Phone = " ";
        await _db.SaveChangesAsync();

        var stored = await ReadStoredUserAsync(user.Id);
        stored.Email.Should().BeNull();
        stored.Phone.Should().BeNull();
        user.EmailLookupHash.Should().BeNull();
        user.PhoneLookupHash.Should().BeNull();
    }

    private async Task<(string? Email, string? Phone, string? EmailHash, string? PhoneHash)> ReadStoredUserAsync(Guid userId)
    {
        await using var command = _connection.CreateCommand();
        command.CommandText = """
            SELECT email, phone, email_lookup_hash, phone_lookup_hash
            FROM users
            WHERE id IS NOT NULL
            LIMIT 1
            """;
        await using var reader = await command.ExecuteReaderAsync();
        (await reader.ReadAsync()).Should().BeTrue();
        return (
            reader.IsDBNull(0) ? null : reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3));
    }

    private static IConfiguration BuildConfiguration()
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Development",
                ["Security:PiiEncryptionKey"] = Convert.ToBase64String(new byte[32])
            })
            .Build();

    private static string BuildMaximumLengthEmail()
    {
        // RFC 5321 规定邮箱地址总长度最多 254 个字符；域名各标签保持在 63 字符以内。
        var localPart = new string('a', 64);
        var domain = string.Join(
            ".",
            new string('b', 63),
            new string('c', 63),
            new string('d', 61));
        return $"{localPart}@{domain}";
    }

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
