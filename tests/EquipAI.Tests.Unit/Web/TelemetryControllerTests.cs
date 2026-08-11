using System.Reflection;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Telemetry;
using EquipAI.Application.Telemetry.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 遥测 HTTP 上报边界测试。
///
/// 这些测试锁定接入层的防御性约束：恶意或损坏的 JSON 只能得到明确的 400，
/// 不能进入异步写入队列后才以 500、数据库异常或告警噪音的形式暴露。
/// </summary>
public class TelemetryControllerTests
{
    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid DeviceId = Guid.NewGuid();

    [Fact]
    public async Task UploadTelemetry_请求体为空_返回400且不入队()
    {
        await using var sut = CreateSut();

        var result = await sut.Controller.UploadTelemetry(null!);

        GetBadRequestMessage(result).Should().Contain("请求体");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_设备标识为空_返回400且不查询设备()
    {
        await using var sut = CreateSut();

        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = " ",
            Metrics = new Dictionary<string, double> { ["temperature"] = 1 },
        });

        GetBadRequestMessage(result).Should().Contain("设备标识");
        sut.Device.VerifyNoOtherCalls();
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_指标为空或为null_返回400且不入队()
    {
        await using var sut = CreateSut();

        var emptyResult = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Metrics = new Dictionary<string, double>(),
        });
        var nullResult = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Metrics = null!,
        });

        GetBadRequestMessage(emptyResult).Should().Contain("指标");
        GetBadRequestMessage(nullResult).Should().Contain("指标");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_指标数量超过上限_返回400且不入队()
    {
        await using var sut = CreateSut();

        var metrics = Enumerable.Range(1, 101)
            .ToDictionary(index => $"metric-{index}", _ => 1d);
        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Metrics = metrics,
        });

        GetBadRequestMessage(result).Should().Contain("指标数量");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\u0001temperature")]
    [InlineData("temperature\n")]
    public async Task UploadTelemetry_指标名非法_返回400且不入队(string metric)
    {
        await using var sut = CreateSut();

        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Metrics = new Dictionary<string, double> { [metric] = 1 },
        });

        GetBadRequestMessage(result).Should().Contain("指标名");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_指标名超过数据库限制_返回400且不入队()
    {
        await using var sut = CreateSut();

        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Metrics = new Dictionary<string, double>
            {
                [new string('m', 101)] = 1,
            },
        });

        GetBadRequestMessage(result).Should().Contain("指标名");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_指标值不是有限数字_返回400且不入队()
    {
        await using var sut = CreateSut();

        foreach (var value in new[] { double.NaN, double.PositiveInfinity, double.NegativeInfinity })
        {
            var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
            {
                DeviceId = DeviceId.ToString(),
                Metrics = new Dictionary<string, double> { ["temperature"] = value },
            });

            GetBadRequestMessage(result).Should().Contain("有限数字");
        }

        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123456789012345678901")]
    public async Task UploadTelemetry_数据质量非法_返回400且不入队(string quality)
    {
        await using var sut = CreateSut();

        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Quality = quality,
            Metrics = new Dictionary<string, double> { ["temperature"] = 1 },
        });

        GetBadRequestMessage(result).Should().Contain("质量");
        sut.Telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UploadTelemetry_有效数据_统一时间戳为Utc并入队()
    {
        await using var sut = CreateSut();
        var timestamp = new DateTime(2026, 8, 12, 12, 0, 0, DateTimeKind.Unspecified);

        var result = await sut.Controller.UploadTelemetry(new TelemetryUploadRequest
        {
            DeviceId = DeviceId.ToString(),
            Timestamp = timestamp,
            Quality = "good",
            Metrics = new Dictionary<string, double> { ["temperature"] = 75.5 },
        });

        result.Should().BeOfType<AcceptedResult>();
        var invocation = sut.Telemetry.Invocations
            .Single(call => call.Method.Name == nameof(ITelemetryService.EnqueueAsync));
        ((DateTime)invocation.Arguments[4]).Kind.Should().Be(DateTimeKind.Utc);
        ((DateTime)invocation.Arguments[4]).Should().Be(timestamp);
    }

    [Fact]
    public void UploadTelemetry_限制请求体大小为256KiB()
    {
        var attribute = typeof(TelemetryController)
            .GetMethod(nameof(TelemetryController.UploadTelemetry))!
            .GetCustomAttribute<RequestSizeLimitAttribute>();

        attribute.Should().NotBeNull();
        ((IRequestSizeLimitMetadata)attribute!).MaxRequestBodySize.Should().Be(256 * 1024);
    }

    private static string GetBadRequestMessage(IActionResult result)
    {
        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var property = badRequest.Value?.GetType().GetProperty("message");
        property.Should().NotBeNull();
        return property!.GetValue(badRequest.Value)?.ToString() ?? string.Empty;
    }

    private static Sut CreateSut()
    {
        var tenantContext = new FixedTenantContext(TenantId);
        var options = new DbContextOptionsBuilder<AppReadDbContext>()
            .UseInMemoryDatabase($"TelemetryController_{Guid.NewGuid():N}")
            .Options;
        var readDb = new AppReadDbContext(options, tenantContext);
        var telemetry = new Mock<ITelemetryService>();
        telemetry
            .Setup(service => service.EnqueueAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(),
                It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        var device = new Mock<IDeviceService>();
        var queryService = new TelemetryQueryService(
            readDb,
            NullLogger<TelemetryQueryService>.Instance);
        var controller = new TelemetryController(
            telemetry.Object,
            device.Object,
            tenantContext,
            queryService);

        return new Sut(controller, telemetry, device, readDb);
    }

    private sealed class Sut(
        TelemetryController controller,
        Mock<ITelemetryService> telemetry,
        Mock<IDeviceService> device,
        AppReadDbContext readDb) : IAsyncDisposable
    {
        public TelemetryController Controller { get; } = controller;
        public Mock<ITelemetryService> Telemetry { get; } = telemetry;
        public Mock<IDeviceService> Device { get; } = device;

        public async ValueTask DisposeAsync() => await readDb.DisposeAsync();
    }

    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
