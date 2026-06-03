# Phase 2B: 前端设备配置向导 + 后端 gateway_devices API + EdgeGateway 远程配置拉取

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替代手动编辑 appsettings.json 的设备配置方式，实现可视化多步向导（前端）+ 网关设备配置 API（后端）+ EdgeGateway 启动时从后端拉取配置，形成"前端配置 → 数据库存储 → 网关拉取"的完整闭环。

**Architecture:** 前端 4 步 React Hook Form + Zod 向导 → `GatewayConfigController`（JWT 认证 CRUD + AuthKey 认证拉取）→ `gateway_devices` 表（PostgreSQL）→ EdgeGateway `Program.cs` 启动时通过 `HttpClient` 拉取配置，fallback 到本地 `appsettings.json`。

**Tech Stack:** .NET 8 (ASP.NET Core WebAPI, EF Core 8, Npgsql) / React 19 + React Hook Form + Zod + shadcn/ui + TanStack Query / PostgreSQL 16

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| 创建 | `src/EquipAI.Core/Entities/GatewayDevice.cs` | 网关设备配置实体 |
| 创建 | `src/EquipAI.Infrastructure/Data/Configurations/GatewayDeviceConfiguration.cs` | EF Core 表映射 |
| 创建 | `src/EquipAI.WebAPI/Controllers/GatewayConfigController.cs` | 网关设备配置 API（CRUD + 拉取 + 测试连接） |
| 创建 | `tests/EquipAI.Tests.Unit/Controllers/GatewayConfigControllerTests.cs` | 控制器单元测试 |
| 创建 | `frontend/src/schemas/gatewayDevice.ts` | Zod 校验 schema |
| 创建 | `frontend/src/hooks/useGatewayDevices.ts` | 网关设备配置 hooks（TanStack Query） |
| 创建 | `frontend/src/components/gateway/ConnectionForm.tsx` | 协议连接参数表单（根据协议动态渲染） |
| 创建 | `frontend/src/components/gateway/DataPointsForm.tsx` | 数据点位添加表单 |
| 创建 | `frontend/src/components/gateway/ConfigReview.tsx` | 配置预览卡片 |
| 修改 | `src/EquipAI.Infrastructure/Data/AppDbContext.cs` | 添加 GatewayDevices DbSet |
| 修改 | `src/EquipAI.EdgeGateway/GatewayOptions.cs` | 添加配置拉取相关选项 |
| 修改 | `src/EquipAI.EdgeGateway/Program.cs` | 启动时从后端 API 拉取配置 |
| 修改 | `frontend/src/types/index.ts` | 添加 GatewayDevice 类型 |
| 修改 | `frontend/src/pages/DeviceSetupPage.tsx` | 重写为 4 步向导 |
| 修改 | `frontend/src/i18n/zh.json` | 添加网关配置相关翻译 |
| 修改 | `frontend/src/i18n/en.json` | 添加网关配置相关翻译 |

---

### Task 1: GatewayDevice 实体 + EF 配置 + 数据库迁移

**Files:**
- Create: `src/EquipAI.Core/Entities/GatewayDevice.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/GatewayDeviceConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: 创建 GatewayDevice 实体**

```csharp
// src/EquipAI.Core/Entities/GatewayDevice.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 网关设备配置 — 描述边缘网关需要连接的一台物理设备的完整采集配置。
/// 由前端向导创建，EdgeGateway 启动时通过 API 拉取。
/// </summary>
public class GatewayDevice : BaseEntity
{
    /// <summary>
    /// 租户 ID（多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 网关标识（如 "gateway-001"），同租户下可部署多个网关
    /// </summary>
    public string GatewayId { get; set; } = string.Empty;

    /// <summary>
    /// 关联的已注册设备 ID（可选，若为 null 表示尚未关联设备表中的记录）
    /// </summary>
    public Guid? DeviceId { get; set; }

    /// <summary>
    /// 设备显示名称（如 "1 号注塑机"）
    /// </summary>
    public string DeviceName { get; set; } = string.Empty;

    /// <summary>
    /// 采集协议类型（opcua / modbus-tcp / modbus-rtu）
    /// </summary>
    public string Protocol { get; set; } = string.Empty;

    /// <summary>
    /// 连接参数（JSONB），不同协议有不同的字段：
    /// - OPC UA: { "serverUrl": "opc.tcp://host:port" }
    /// - Modbus TCP: { "host": "192.168.1.100", "port": 502 }
    /// - Modbus RTU: { "port": "/dev/ttyUSB0", "baudRate": 9600, "dataBits": 8, "parity": "N", "stopBits": 1 }
    /// </summary>
    public string ConnectionConfig { get; set; } = "{}";

    /// <summary>
    /// 采集点位映射（JSONB），格式：
    /// { "temperature": "ns=2;s=Temperature", "pressure": "holding_register:100" }
    /// key = 指标名称，value = 协议相关的点位标识
    /// </summary>
    public string DataPoints { get; set; } = "{}";

    /// <summary>
    /// 轮询采集间隔（毫秒），默认 3000ms
    /// </summary>
    public int PollIntervalMs { get; set; } = 3000;

    /// <summary>
    /// 是否启用该设备配置（disabled 的设备不会被 EdgeGateway 拉取）
    /// </summary>
    public bool Enabled { get; set; } = true;
}
```

- [ ] **Step 2: 创建 EF Core 配置类**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/GatewayDeviceConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 网关设备配置表 EF Core 映射
/// </summary>
public class GatewayDeviceConfiguration : IEntityTypeConfiguration<GatewayDevice>
{
    public void Configure(EntityTypeBuilder<GatewayDevice> builder)
    {
        builder.ToTable("gateway_devices");

        // ConnectionConfig 和 DataPoints 使用 JSONB 存储，便于灵活的协议参数和点位映射
        builder.Property(e => e.ConnectionConfig).HasColumnType("jsonb").IsRequired();
        builder.Property(e => e.DataPoints).HasColumnType("jsonb").IsRequired();

        // 网关标识长度限制
        builder.Property(e => e.GatewayId).HasMaxLength(64);
        // 设备名称长度限制
        builder.Property(e => e.DeviceName).HasMaxLength(200);
        // 协议类型长度限制
        builder.Property(e => e.Protocol).HasMaxLength(32);

        // 按租户 + 网关 ID 查询：用于 EdgeGateway 拉取指定网关的所有设备配置
        builder.HasIndex(e => new { e.TenantId, e.GatewayId });

        // 按租户 + 启用状态查询：用于筛选启用的设备配置
        builder.HasIndex(e => new { e.TenantId, e.Enabled });

        // 按租户 + 关联设备 ID 查询：用于检查设备是否已有网关配置
        builder.HasIndex(e => new { e.TenantId, e.DeviceId });
    }
}
```

- [ ] **Step 3: 在 AppDbContext 中注册 DbSet**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 的 DbSet 区域，在 `FaultCases` 之后、`TechnicianProfiles` 之前添加：

```csharp
    /// <summary>
    /// 网关设备配置表（EdgeGateway 采集设备的连接和点位配置）
    /// </summary>
    public DbSet<GatewayDevice> GatewayDevices => Set<GatewayDevice>();
```

- [ ] **Step 4: 创建 EF Core 迁移**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet ef migrations add AddGatewayDevices \
  --project src/EquipAI.Infrastructure \
  --startup-project src/EquipAI.WebAPI \
  --output-dir Data/Migrations
```

- [ ] **Step 5: 检查生成的迁移文件**

确认生成的迁移文件包含：
- `CreateTable("gateway_devices")` 含所有列和索引
- JSONB 列类型正确（`connection_config`、`data_points`）
- 索引包含 `tenant_id + gateway_id`、`tenant_id + enabled`、`tenant_id + device_id`

Run: `cat src/EquipAI.Infrastructure/Data/Migrations/*AddGatewayDevices*.cs | head -80`

- [ ] **Step 6: 应用迁移到数据库**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet ef database update \
  --project src/EquipAI.Infrastructure \
  --startup-project src/EquipAI.WebAPI
```

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Core/Entities/GatewayDevice.cs \
  src/EquipAI.Infrastructure/Data/Configurations/GatewayDeviceConfiguration.cs \
  src/EquipAI.Infrastructure/Data/AppDbContext.cs \
  src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: GatewayDevice 实体 + EF 配置 + 数据库迁移

- GatewayDevice 实体：网关标识、协议类型、连接参数(JSONB)、点位映射(JSONB)
- GatewayDeviceConfiguration：表映射、JSONB 列、三组复合索引
- AppDbContext 注册 GatewayDevices DbSet
- EF Core 迁移 AddGatewayDevices"
```

---

### Task 2: GatewayConfigController — 网关设备配置 CRUD + 配置拉取 API

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/GatewayConfigController.cs`

- [ ] **Step 1: 确认 WebAPI 项目引用 EdgeGateway 项目**

因为 `GatewayConfigController` 直接使用 `OpcUaAdapter` 和 `ModbusTcpAdapter` 进行测试连接，需要确认 WebAPI 项目能引用 EdgeGateway 项目。

Run: `grep "EdgeGateway" /Users/yqgmac/yqg/project/EquipSense/src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`

如果没有引用，需要在 `EquipAI.WebAPI.csproj` 的 `<ItemGroup>` 中添加：
```xml
<ProjectReference Include="..\EquipAI.EdgeGateway\EquipAI.EdgeGateway.csproj" />
```

- [ ] **Step 2: 创建 GatewayConfigController**

```csharp
// src/EquipAI.WebAPI/Controllers/GatewayConfigController.cs
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 网关设备配置控制器
/// 提供网关配置的 CRUD 操作、EdgeGateway 配置拉取和连接测试接口。
/// - JWT 认证端点：供前端管理界面使用
/// - AuthKey 认证端点：供 EdgeGateway 启动时拉取配置使用
/// </summary>
[ApiController]
[Route("api/v1/gateway")]
public class GatewayConfigController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewayConfigController> _logger;

    public GatewayConfigController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IConfiguration configuration,
        ILogger<GatewayConfigController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// EdgeGateway 拉取配置 — 返回指定网关下所有启用的设备配置。
    /// 认证方式：请求 Header 携带 X-Gateway-Auth-Key，值需匹配环境变量 GATEWAY_AUTH_KEY。
    /// </summary>
    /// <param name="gatewayId">网关标识（如 "gateway-001"）</param>
    [HttpGet("config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GatewayDevicePullResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<GatewayDevicePullResponse>>> GetGatewayConfig(
        [FromQuery] string gatewayId)
    {
        // 验证网关认证密钥
        var authKey = HttpContext.Request.Headers["X-Gateway-Auth-Key"].FirstOrDefault();
        var expectedKey = _configuration["GATEWAY_AUTH_KEY"]
            ?? _configuration["Gateway:AuthKey"]
            ?? string.Empty;

        if (string.IsNullOrEmpty(authKey) || authKey != expectedKey)
        {
            return Unauthorized(new { code = 401, message = "网关认证密钥无效" });
        }

        if (string.IsNullOrWhiteSpace(gatewayId))
        {
            return BadRequest(new { code = 400, message = "gatewayId 参数不能为空" });
        }

        // 从请求头获取租户 ID（EdgeGateway 通过 X-Tenant-Id 头传递租户信息）
        var tenantIdStr = HttpContext.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            return BadRequest(new { code = 400, message = "X-Tenant-Id 请求头无效" });
        }

        // 查询该网关下所有启用的设备配置（绕过租户过滤器，使用显式条件）
        var devices = await _dbContext.UnfilteredSet<Core.Entities.GatewayDevice>()
            .Where(d => d.TenantId == tenantId && d.GatewayId == gatewayId && d.Enabled)
            .OrderBy(d => d.DeviceName)
            .ToListAsync(HttpContext.RequestAborted);

        // 转换为 EdgeGateway 可直接使用的格式（包含 ConnectionString）
        var result = devices.Select(d => new GatewayDevicePullResponse
        {
            DeviceId = d.DeviceId?.ToString() ?? d.DeviceName,
            Protocol = d.Protocol,
            ConnectionString = BuildConnectionString(d.Protocol, d.ConnectionConfig),
            DataPoints = ParseDataPoints(d.DataPoints),
            PollIntervalMs = d.PollIntervalMs,
            DeviceType = d.DeviceName
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// 分页查询当前租户的网关设备配置列表
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="gatewayId">可选：按网关标识筛选</param>
    [HttpGet("devices")]
    [Authorize]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(PagedResult<GatewayDeviceResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<GatewayDeviceResponse>>> GetDevices(
        [FromQuery] PagedQuery query,
        [FromQuery] string? gatewayId = null)
    {
        var devices = _dbContext.GatewayDevices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(gatewayId))
            devices = devices.Where(d => d.GatewayId == gatewayId);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            devices = devices.Where(d => EF.Functions.ILike(d.DeviceName, keyword));
        }

        var (items, total) = await devices.ToPagedAsync(query, HttpContext.RequestAborted);

        return Ok(new PagedResult<GatewayDeviceResponse>
        {
            Items = items.Select(MapToResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    /// <summary>
    /// 创建网关设备配置
    /// </summary>
    /// <param name="request">创建请求</param>
    [HttpPost("devices")]
    [Authorize]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(GatewayDeviceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GatewayDeviceResponse>> CreateDevice(
        [FromBody] CreateGatewayDeviceRequest request)
    {
        // 校验协议类型是否合法
        var validProtocols = new[] { "opcua", "modbus-tcp", "modbus-rtu" };
        if (!validProtocols.Contains(request.Protocol))
        {
            return BadRequest(new { code = 400, message = $"不支持的协议类型: {request.Protocol}，支持的协议: {string.Join(", ", validProtocols)}" });
        }

        var entity = new Core.Entities.GatewayDevice
        {
            TenantId = _tenantContext.TenantId,
            GatewayId = request.GatewayId,
            DeviceId = request.DeviceId,
            DeviceName = request.DeviceName,
            Protocol = request.Protocol,
            ConnectionConfig = request.ConnectionConfig,
            DataPoints = request.DataPoints,
            PollIntervalMs = request.PollIntervalMs,
            Enabled = request.Enabled
        };

        _dbContext.GatewayDevices.Add(entity);
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return CreatedAtAction(nameof(GetDevices), new { id = entity.Id }, MapToResponse(entity));
    }

    /// <summary>
    /// 更新网关设备配置
    /// </summary>
    /// <param name="id">设备配置 ID</param>
    /// <param name="request">更新请求</param>
    [HttpPut("devices/{id:guid}")]
    [Authorize]
    [RequirePermission("device:update")]
    [ProducesResponseType(typeof(GatewayDeviceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GatewayDeviceResponse>> UpdateDevice(
        Guid id, [FromBody] UpdateGatewayDeviceRequest request)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync([id], HttpContext.RequestAborted);
        if (entity is null)
        {
            return NotFound(new { code = 404, message = "网关设备配置不存在" });
        }

        // 仅更新请求中提供的非 null 字段
        if (request.DeviceName is not null)
            entity.DeviceName = request.DeviceName;
        if (request.ConnectionConfig is not null)
            entity.ConnectionConfig = request.ConnectionConfig;
        if (request.DataPoints is not null)
            entity.DataPoints = request.DataPoints;
        if (request.PollIntervalMs.HasValue)
            entity.PollIntervalMs = request.PollIntervalMs.Value;
        if (request.Enabled.HasValue)
            entity.Enabled = request.Enabled.Value;
        if (request.DeviceId.HasValue)
            entity.DeviceId = request.DeviceId.Value;

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(MapToResponse(entity));
    }

    /// <summary>
    /// 删除网关设备配置
    /// </summary>
    /// <param name="id">设备配置 ID</param>
    [HttpDelete("devices/{id:guid}")]
    [Authorize]
    [RequirePermission("device:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevice(Guid id)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync([id], HttpContext.RequestAborted);
        if (entity is null)
        {
            return NotFound(new { code = 404, message = "网关设备配置不存在" });
        }

        _dbContext.GatewayDevices.Remove(entity);
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return NoContent();
    }

    /// <summary>
    /// 测试设备连接 — 创建临时协议适配器尝试连接目标设备。
    /// 接收协议类型和连接参数，尝试连接后立即断开，返回连接结果。
    /// </summary>
    /// <param name="request">连接测试请求（协议类型 + 连接参数）</param>
    [HttpPost("devices/test-connection")]
    [Authorize]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(TestConnectionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestConnectionResponse>> TestConnection(
        [FromBody] TestConnectionRequest request)
    {
        var validProtocols = new[] { "opcua", "modbus-tcp", "modbus-rtu" };
        if (!validProtocols.Contains(request.Protocol))
        {
            return BadRequest(new { code = 400, message = $"不支持的协议类型: {request.Protocol}" });
        }

        try
        {
            // Modbus RTU 需要物理串口，不支持远程测试
            if (request.Protocol == "modbus-rtu")
            {
                return Ok(new TestConnectionResponse
                {
                    Success = false,
                    Message = "Modbus RTU 测试连接需要物理串口，暂不支持远程测试"
                });
            }

            // 构建临时 DeviceConfig 供适配器连接使用
            var tempConfig = BuildDeviceConfig(request);
            using var adapter = CreateAdapter(request.Protocol);
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

            await adapter.ConnectAsync(tempConfig, cts.Token);

            var connected = adapter.IsConnected;

            // 断开连接
            await adapter.DisposeAsync();

            return Ok(new TestConnectionResponse
            {
                Success = connected,
                Message = connected ? "连接成功" : "连接失败：适配器报告未连接"
            });
        }
        catch (TimeoutException)
        {
            return Ok(new TestConnectionResponse
            {
                Success = false,
                Message = "连接超时（10 秒），请检查网络和设备地址"
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "测试连接失败: {Protocol}", request.Protocol);
            return Ok(new TestConnectionResponse
            {
                Success = false,
                Message = $"连接失败：{ex.Message}"
            });
        }
    }

    #region 私有方法

    /// <summary>
    /// 根据协议类型创建对应的协议适配器实例
    /// </summary>
    private static EquipAI.EdgeGateway.Protocols.IProtocolAdapter CreateAdapter(string protocol)
    {
        return protocol switch
        {
            "opcua" => new EquipAI.EdgeGateway.Protocols.OpcUaAdapter(),
            "modbus-tcp" => new EquipAI.EdgeGateway.Protocols.ModbusTcpAdapter(),
            _ => throw new ArgumentException($"不支持的协议: {protocol}")
        };
    }

    /// <summary>
    /// 根据测试连接请求构建临时的 DeviceConfig
    /// </summary>
    private static EquipAI.EdgeGateway.Protocols.DeviceConfig BuildDeviceConfig(TestConnectionRequest request)
    {
        // 从 ConnectionConfig JSON 中提取连接字符串
        var connStr = request.Protocol switch
        {
            "opcua" => ExtractStringField(request.ConnectionConfig, "serverUrl"),
            "modbus-tcp" => BuildModbusTcpConnectionString(request.ConnectionConfig),
            _ => request.ConnectionConfig
        };

        return new EquipAI.EdgeGateway.Protocols.DeviceConfig(
            DeviceId: "test-connection",
            Protocol: request.Protocol,
            ConnectionString: connStr,
            DataPoints: new Dictionary<string, string>(),
            PollIntervalMs: 3000
        );
    }

    /// <summary>
    /// 从 JSONB 连接参数中提取指定字段的字符串值
    /// </summary>
    private static string ExtractStringField(string json, string fieldName)
    {
        var doc = System.Text.Json.JsonDocument.Parse(json);
        if (doc.RootElement.TryGetProperty(fieldName, out var element))
            return element.GetString() ?? string.Empty;
        return string.Empty;
    }

    /// <summary>
    /// 从 JSONB 连接参数构建 Modbus TCP 连接字符串（host:port 格式）
    /// </summary>
    private static string BuildModbusTcpConnectionString(string connectionConfig)
    {
        var doc = System.Text.Json.JsonDocument.Parse(connectionConfig);
        var host = doc.RootElement.TryGetProperty("host", out var h) ? h.GetString() ?? "localhost" : "localhost";
        var port = doc.RootElement.TryGetProperty("port", out var p) ? p.GetInt32() : 502;
        return $"{host}:{port}";
    }

    /// <summary>
    /// 根据协议类型将 JSONB 连接参数转换为协议相关的连接字符串
    /// </summary>
    private static string BuildConnectionString(string protocol, string connectionConfig)
    {
        try
        {
            return protocol switch
            {
                "opcua" => ExtractStringField(connectionConfig, "serverUrl"),
                "modbus-tcp" => BuildModbusTcpConnectionString(connectionConfig),
                "modbus-rtu" => BuildModbusRtuConnectionString(connectionConfig),
                _ => connectionConfig
            };
        }
        catch
        {
            return connectionConfig;
        }
    }

    /// <summary>
    /// 从 JSONB 连接参数构建 Modbus RTU 连接字符串（port:baudRate:dataBits:parity:stopBits 格式）
    /// </summary>
    private static string BuildModbusRtuConnectionString(string connectionConfig)
    {
        var doc = System.Text.Json.JsonDocument.Parse(connectionConfig);
        var port = doc.RootElement.TryGetProperty("port", out var p) ? p.GetString() ?? "" : "";
        var baudRate = doc.RootElement.TryGetProperty("baudRate", out var br) ? br.GetInt32() : 9600;
        var dataBits = doc.RootElement.TryGetProperty("dataBits", out var db) ? db.GetInt32() : 8;
        var parity = doc.RootElement.TryGetProperty("parity", out var par) ? par.GetString() ?? "N" : "N";
        var stopBits = doc.RootElement.TryGetProperty("stopBits", out var sb) ? sb.GetInt32() : 1;
        return $"{port}:{baudRate}:{dataBits}:{parity}:{stopBits}";
    }

    /// <summary>
    /// 解析 JSONB 数据点位映射为 Dictionary
    /// </summary>
    private static Dictionary<string, string> ParseDataPoints(string dataPointsJson)
    {
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(dataPointsJson)
                ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    /// <summary>
    /// 将 GatewayDevice 实体映射为响应 DTO
    /// </summary>
    private static GatewayDeviceResponse MapToResponse(Core.Entities.GatewayDevice entity) => new()
    {
        Id = entity.Id,
        GatewayId = entity.GatewayId,
        DeviceId = entity.DeviceId,
        DeviceName = entity.DeviceName,
        Protocol = entity.Protocol,
        ConnectionConfig = entity.ConnectionConfig,
        DataPoints = entity.DataPoints,
        PollIntervalMs = entity.PollIntervalMs,
        Enabled = entity.Enabled,
        CreatedAt = entity.CreatedAt
    };

    #endregion

    #region 请求/响应 DTO

    /// <summary>
    /// 创建网关设备配置请求
    /// </summary>
    public class CreateGatewayDeviceRequest
    {
        /// <summary>网关标识</summary>
        public string GatewayId { get; set; } = string.Empty;

        /// <summary>关联的已注册设备 ID（可选）</summary>
        public Guid? DeviceId { get; set; }

        /// <summary>设备显示名称</summary>
        public string DeviceName { get; set; } = string.Empty;

        /// <summary>采集协议类型（opcua / modbus-tcp / modbus-rtu）</summary>
        public string Protocol { get; set; } = string.Empty;

        /// <summary>连接参数（JSONB）</summary>
        public string ConnectionConfig { get; set; } = "{}";

        /// <summary>采集点位映射（JSONB）</summary>
        public string DataPoints { get; set; } = "{}";

        /// <summary>轮询采集间隔（毫秒），默认 3000</summary>
        public int PollIntervalMs { get; set; } = 3000;

        /// <summary>是否启用，默认 true</summary>
        public bool Enabled { get; set; } = true;
    }

    /// <summary>
    /// 更新网关设备配置请求（所有字段可选，仅更新提供的字段）
    /// </summary>
    public class UpdateGatewayDeviceRequest
    {
        /// <summary>设备显示名称</summary>
        public string? DeviceName { get; set; }

        /// <summary>关联的已注册设备 ID</summary>
        public Guid? DeviceId { get; set; }

        /// <summary>连接参数（JSONB）</summary>
        public string? ConnectionConfig { get; set; }

        /// <summary>采集点位映射（JSONB）</summary>
        public string? DataPoints { get; set; }

        /// <summary>轮询采集间隔（毫秒）</summary>
        public int? PollIntervalMs { get; set; }

        /// <summary>是否启用</summary>
        public bool? Enabled { get; set; }
    }

    /// <summary>
    /// 测试连接请求
    /// </summary>
    public class TestConnectionRequest
    {
        /// <summary>协议类型（opcua / modbus-tcp）</summary>
        public string Protocol { get; set; } = string.Empty;

        /// <summary>连接参数（JSONB，格式与 ConnectionConfig 一致）</summary>
        public string ConnectionConfig { get; set; } = "{}";
    }

    /// <summary>
    /// 测试连接响应
    /// </summary>
    public class TestConnectionResponse
    {
        /// <summary>是否连接成功</summary>
        public bool Success { get; set; }

        /// <summary>结果描述信息</summary>
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// 网关设备配置响应 DTO（前端 CRUD 使用）
    /// </summary>
    public class GatewayDeviceResponse
    {
        /// <summary>配置记录 ID</summary>
        public Guid Id { get; set; }

        /// <summary>网关标识</summary>
        public string GatewayId { get; set; } = string.Empty;

        /// <summary>关联的已注册设备 ID</summary>
        public Guid? DeviceId { get; set; }

        /// <summary>设备显示名称</summary>
        public string DeviceName { get; set; } = string.Empty;

        /// <summary>采集协议类型</summary>
        public string Protocol { get; set; } = string.Empty;

        /// <summary>连接参数（JSONB）</summary>
        public string ConnectionConfig { get; set; } = "{}";

        /// <summary>采集点位映射（JSONB）</summary>
        public string DataPoints { get; set; } = "{}";

        /// <summary>轮询采集间隔（毫秒）</summary>
        public int PollIntervalMs { get; set; }

        /// <summary>是否启用</summary>
        public bool Enabled { get; set; }

        /// <summary>创建时间</summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// EdgeGateway 配置拉取响应 DTO（包含 ConnectionString，EdgeGateway 可直接使用）
    /// </summary>
    public class GatewayDevicePullResponse
    {
        /// <summary>设备标识（关联设备 ID 或设备名称）</summary>
        public string DeviceId { get; set; } = string.Empty;

        /// <summary>协议类型</summary>
        public string Protocol { get; set; } = string.Empty;

        /// <summary>协议相关连接字符串</summary>
        public string ConnectionString { get; set; } = string.Empty;

        /// <summary>采集点位映射</summary>
        public Dictionary<string, string> DataPoints { get; set; } = new();

        /// <summary>轮询采集间隔（毫秒）</summary>
        public int PollIntervalMs { get; set; }

        /// <summary>设备类型（设备显示名称）</summary>
        public string? DeviceType { get; set; }
    }

    #endregion
}
```

- [ ] **Step 3: 构建确认编译通过**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet build src/EquipAI.WebAPI
```

Expected: Build succeeded, 0 errors

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/GatewayConfigController.cs \
  src/EquipAI.WebAPI/EquipAI.WebAPI.csproj
git commit -m "feat: GatewayConfigController — 网关设备配置 CRUD + AuthKey 拉取 + 连接测试

- GET /gateway/config: EdgeGateway 通过 AuthKey + TenantId 拉取配置
- GET /gateway/devices: 分页查询设备配置（JWT 认证）
- POST /gateway/devices: 创建设备配置
- PUT /gateway/devices/{id}: 更新设备配置
- DELETE /gateway/devices/{id}: 删除设备配置
- POST /gateway/devices/test-connection: 临时创建适配器测试连接
- GatewayDevicePullResponse 包含 ConnectionString，EdgeGateway 可直接使用"
```

---

### Task 3: test-connection 端点和 Controller 单元测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Controllers/GatewayConfigControllerTests.cs`

- [ ] **Step 1: 创建控制器单元测试**

测试覆盖以下场景：
- `POST /gateway/devices` 创建成功
- `POST /gateway/devices` 协议类型非法时返回 400
- `PUT /gateway/devices/{id}` 更新成功
- `PUT /gateway/devices/{id}` 不存在时返回 404
- `DELETE /gateway/devices/{id}` 删除成功
- `DELETE /gateway/devices/{id}` 不存在时返回 404
- `GET /gateway/devices` 按网关标识筛选

```csharp
// tests/EquipAI.Tests.Unit/Controllers/GatewayConfigControllerTests.cs
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Controllers;

/// <summary>
/// GatewayConfigController 单元测试 — 验证网关设备配置的 CRUD 和认证逻辑
/// </summary>
public class GatewayConfigControllerTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly GatewayConfigController _controller;
    private readonly Guid _tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public GatewayConfigControllerTests()
    {
        // 使用 InMemory 数据库进行单元测试
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"gateway_test_{Guid.NewGuid()}")
            .Options;

        _tenantContextMock = new Mock<ITenantContext>();
        _tenantContextMock.Setup(t => t.TenantId).Returns(_tenantId);
        _tenantContextMock.Setup(t => t.UserId).Returns(Guid.Parse("22222222-2222-2222-2222-222222222222"));

        _dbContext = new AppDbContext(options, _tenantContextMock.Object);

        var configMock = new Mock<IConfiguration>();
        var loggerMock = new Mock<ILogger<GatewayConfigController>>();

        _controller = new GatewayConfigController(
            _dbContext, _tenantContextMock.Object, configMock.Object, loggerMock.Object);
    }

    [Fact]
    public async Task CreateDevice_合法参数时创建成功()
    {
        // Arrange
        var request = new GatewayConfigController.CreateGatewayDeviceRequest
        {
            GatewayId = "gateway-001",
            DeviceName = "测试注塑机",
            Protocol = "opcua",
            ConnectionConfig = """{"serverUrl":"opc.tcp://localhost:4840"}""",
            DataPoints = """{"temperature":"ns=2;s=Temperature"}""",
            PollIntervalMs = 3000,
            Enabled = true
        };

        // Act
        var result = await _controller.CreateDevice(request) as CreatedAtActionResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(201);
        var response = result.Value as GatewayConfigController.GatewayDeviceResponse;
        response.Should().NotBeNull();
        response!.DeviceName.Should().Be("测试注塑机");
        response.Protocol.Should().Be("opcua");
    }

    [Fact]
    public async Task CreateDevice_非法协议类型时返回400()
    {
        // Arrange
        var request = new GatewayConfigController.CreateGatewayDeviceRequest
        {
            GatewayId = "gateway-001",
            DeviceName = "测试设备",
            Protocol = "invalid-protocol",
            ConnectionConfig = "{}",
            DataPoints = "{}"
        };

        // Act
        var result = await _controller.CreateDevice(request) as BadRequestObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task UpdateDevice_存在时更新成功()
    {
        // Arrange — 先创建一条记录
        var entity = new GatewayDevice
        {
            TenantId = _tenantId,
            GatewayId = "gateway-001",
            DeviceName = "旧名称",
            Protocol = "modbus-tcp",
            ConnectionConfig = """{"host":"192.168.1.100","port":502}""",
            DataPoints = "{}"
        };
        _dbContext.GatewayDevices.Add(entity);
        await _dbContext.SaveChangesAsync();

        var updateRequest = new GatewayConfigController.UpdateGatewayDeviceRequest
        {
            DeviceName = "新名称",
            PollIntervalMs = 5000
        };

        // Act
        var result = await _controller.UpdateDevice(entity.Id, updateRequest) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var response = result!.Value as GatewayConfigController.GatewayDeviceResponse;
        response!.DeviceName.Should().Be("新名称");
        response.PollIntervalMs.Should().Be(5000);
    }

    [Fact]
    public async Task UpdateDevice_不存在时返回404()
    {
        // Arrange
        var updateRequest = new GatewayConfigController.UpdateGatewayDeviceRequest
        {
            DeviceName = "不存在"
        };

        // Act
        var result = await _controller.UpdateDevice(Guid.NewGuid(), updateRequest) as NotFoundObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task DeleteDevice_存在时删除成功()
    {
        // Arrange
        var entity = new GatewayDevice
        {
            TenantId = _tenantId,
            GatewayId = "gateway-001",
            DeviceName = "待删除设备",
            Protocol = "opcua",
            ConnectionConfig = "{}",
            DataPoints = "{}"
        };
        _dbContext.GatewayDevices.Add(entity);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteDevice(entity.Id) as NoContentResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(204);

        // 验证数据库中已不存在
        var deleted = await _dbContext.GatewayDevices.FindAsync(entity.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteDevice_不存在时返回404()
    {
        // Act
        var result = await _controller.DeleteDevice(Guid.NewGuid()) as NotFoundObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task GetDevices_按网关标识筛选()
    {
        // Arrange — 创建两条不同网关的记录
        _dbContext.GatewayDevices.AddRange(
            new GatewayDevice
            {
                TenantId = _tenantId,
                GatewayId = "gateway-001",
                DeviceName = "设备A",
                Protocol = "opcua",
                ConnectionConfig = "{}",
                DataPoints = "{}"
            },
            new GatewayDevice
            {
                TenantId = _tenantId,
                GatewayId = "gateway-002",
                DeviceName = "设备B",
                Protocol = "modbus-tcp",
                ConnectionConfig = "{}",
                DataPoints = "{}"
            }
        );
        await _dbContext.SaveChangesAsync();

        var query = new EquipAI.Application.DTOs.Common.PagedQuery { PageSize = 20 };

        // Act
        var result = await _controller.GetDevices(query, "gateway-001") as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var paged = result!.Value as EquipAI.Core.Models.PagedResult<GatewayConfigController.GatewayDeviceResponse>;
        paged!.Items.Should().HaveCount(1);
        paged.Items[0].DeviceName.Should().Be("设备A");
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
```

- [ ] **Step 2: 运行测试**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet test tests/EquipAI.Tests.Unit --filter "GatewayConfigController" --no-restore -v n
```

Expected: 6 个测试全部 PASS

- [ ] **Step 3: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Controllers/GatewayConfigControllerTests.cs
git commit -m "test: GatewayConfigController 单元测试 — CRUD + 筛选 + 404 场景

- CreateDevice 成功/非法协议
- UpdateDevice 成功/不存在
- DeleteDevice 成功/不存在
- GetDevices 按网关标识筛选"
```

---

### Task 4: EdgeGateway Program.cs — 启动时从后端 API 拉取配置

**Files:**
- Modify: `src/EquipAI.EdgeGateway/GatewayOptions.cs`
- Modify: `src/EquipAI.EdgeGateway/Program.cs`

- [ ] **Step 1: 扩展 GatewayOptions 添加配置拉取相关选项**

在 `src/EquipAI.EdgeGateway/GatewayOptions.cs` 的 `AuthKey` 属性之后添加以下两个属性：

```csharp
    /// <summary>
    /// 是否优先从后端 API 拉取设备配置（false 时仅使用本地 appsettings.json）
    /// </summary>
    public bool PullConfigFromBackend { get; set; } = false;

    /// <summary>
    /// 配置拉取 API 超时时间（秒），默认 10 秒
    /// </summary>
    public int ConfigPullTimeoutSeconds { get; set; } = 10;
```

- [ ] **Step 2: 重写 Program.cs 添加 API 配置拉取逻辑**

完整重写 `src/EquipAI.EdgeGateway/Program.cs`：

```csharp
// src/EquipAI.EdgeGateway/Program.cs
using System.Text.Json;
using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    // 绑定配置
    builder.Services.Configure<GatewayOptions>(
        builder.Configuration.GetSection(GatewayOptions.SectionName));
    builder.Services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<GatewayOptions>>().Value);

    // 注册协议适配器工厂
    var adapterFactory = new Func<string, IProtocolAdapter>(protocol => protocol switch
    {
        "opcua" => new OpcUaAdapter(),
        "modbus-tcp" => new ModbusTcpAdapter(),
        _ => throw new ArgumentException($"不支持的协议: {protocol}")
    });

    // 注册上传器
    builder.Services.AddSingleton<CloudUploader>();

    // ===== 设备配置加载 =====
    // 优先从后端 API 拉取配置，fallback 到本地 appsettings.json
    var gatewayOptions = new GatewayOptions();
    builder.Configuration.GetSection(GatewayOptions.SectionName).Bind(gatewayOptions);
    var localDevices = builder.Configuration.GetSection("Devices").Get<DeviceConfig[]>() ?? [];

    var devices = await LoadDeviceConfigsAsync(gatewayOptions, localDevices);

    Log.Information("已加载 {Count} 个设备配置", devices.Length);

    // 为每个设备注册 DataCollector
    foreach (var device in devices)
    {
        var deviceConfig = device;
        builder.Services.AddSingleton<IHostedService>(sp => new DataCollector(
            sp.GetRequiredService<ILogger<DataCollector>>(),
            adapterFactory(deviceConfig.Protocol),
            sp.GetRequiredService<CloudUploader>(),
            deviceConfig,
            deviceConfig.DeviceType ?? "Unknown"));
    }

    builder.Services.AddSerilog();

    var host = builder.Build();
    Log.Information("边缘网关启动中...");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "边缘网关启动失败");
}
finally
{
    await Log.CloseAndFlushAsync();
}

// =========================================================================
// 配置加载方法（文件级别顶级语句）
// =========================================================================

/// <summary>
/// 加载设备配置 — 优先从后端 API 拉取，失败时 fallback 到本地 appsettings.json
/// </summary>
/// <param name="options">网关全局配置</param>
/// <param name="localDevices">本地 appsettings.json 中的设备配置（fallback）</param>
/// <returns>设备配置数组</returns>
static async Task<DeviceConfig[]> LoadDeviceConfigsAsync(GatewayOptions options, DeviceConfig[] localDevices)
{
    // 未启用 API 拉取时直接使用本地配置
    if (!options.PullConfigFromBackend)
    {
        Log.Information("API 配置拉取未启用，使用本地配置（{Count} 个设备）", localDevices.Length);
        return localDevices;
    }

    try
    {
        Log.Information("正在从后端 API 拉取设备配置: {Url}", options.BackendUrl);
        var pulledDevices = await PullDevicesFromBackendAsync(options);

        if (pulledDevices.Length > 0)
        {
            Log.Information("从后端 API 拉取到 {Count} 个设备配置", pulledDevices.Length);
            return pulledDevices;
        }

        Log.Warning("后端 API 返回 0 个设备配置，fallback 到本地配置");
        return localDevices;
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "从后端 API 拉取设备配置失败，fallback 到本地配置（{Count} 个设备）", localDevices.Length);
        return localDevices;
    }
}

/// <summary>
/// 通过 HTTP 调用后端 API 拉取网关设备配置
/// GET /api/v1/gateway/config?gatewayId=xxx
/// Header: X-Gateway-Auth-Key + X-Tenant-Id
/// </summary>
static async Task<DeviceConfig[]> PullDevicesFromBackendAsync(GatewayOptions options)
{
    using var httpClient = new HttpClient
    {
        Timeout = TimeSpan.FromSeconds(options.ConfigPullTimeoutSeconds)
    };

    // 设置认证头
    httpClient.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", options.AuthKey);
    httpClient.DefaultRequestHeaders.Add("X-Tenant-Id", options.TenantId);

    var url = $"{options.BackendUrl.TrimEnd('/')}/api/v1/gateway/config?gatewayId={Uri.EscapeDataString(options.Id)}";
    var response = await httpClient.GetAsync(url);

    response.EnsureSuccessStatusCode();

    var json = await response.Content.ReadAsStringAsync();
    var apiDevices = JsonSerializer.Deserialize<List<ApiGatewayDevice>>(json, new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    });

    if (apiDevices is null || apiDevices.Count == 0)
    {
        return [];
    }

    // 将 API 响应转换为 EdgeGateway 的 DeviceConfig 格式
    return apiDevices.Select(d => new DeviceConfig(
        DeviceId: d.DeviceId,
        Protocol: d.Protocol,
        ConnectionString: d.ConnectionString,
        DataPoints: d.DataPoints,
        PollIntervalMs: d.PollIntervalMs
    )
    {
        DeviceType = d.DeviceType
    }).ToArray();
}

/// <summary>
/// API 响应中的网关设备配置结构（用于 JSON 反序列化）
/// 与 GatewayDevicePullResponse 对应
/// </summary>
internal record ApiGatewayDevice(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs,
    string? DeviceType);
```

- [ ] **Step 3: 更新 appsettings.json 示例配置**

确保 `src/EquipAI.EdgeGateway/appsettings.json` 的 Gateway 节包含新选项：

```json
{
  "Gateway": {
    "Id": "gateway-001",
    "TenantId": "",
    "BackendUrl": "http://localhost:8080",
    "MqttBroker": "localhost:1883",
    "AuthKey": "",
    "PullConfigFromBackend": true,
    "ConfigPullTimeoutSeconds": 10
  },
  "Devices": []
}
```

注意：当 `PullConfigFromBackend: true` 且 API 返回设备配置时，本地 `Devices` 节的内容会被忽略。当 API 拉取失败或返回空时，fallback 使用本地 `Devices` 节。

- [ ] **Step 4: 构建确认编译通过**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense
dotnet build src/EquipAI.EdgeGateway
```

Expected: Build succeeded, 0 errors

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Program.cs \
  src/EquipAI.EdgeGateway/GatewayOptions.cs \
  src/EquipAI.EdgeGateway/appsettings.json
git commit -m "feat: EdgeGateway 启动时从后端 API 拉取设备配置

- GatewayOptions 新增 PullConfigFromBackend 和 ConfigPullTimeoutSeconds
- LoadDeviceConfigsAsync: 优先 API 拉取，fallback 本地配置
- PullDevicesFromBackendAsync: GET /gateway/config + AuthKey + TenantId
- API 响应直接包含 ConnectionString，无需再次转换
- PullConfigFromBackend=true 时自动拉取，失败降级到本地"
```

---

### Task 5: 前端 useGatewayDevices hook + DeviceSetupPage 4 步向导重写

**Files:**
- Create: `frontend/src/schemas/gatewayDevice.ts`
- Create: `frontend/src/hooks/useGatewayDevices.ts`
- Create: `frontend/src/components/gateway/ConnectionForm.tsx`
- Create: `frontend/src/components/gateway/DataPointsForm.tsx`
- Create: `frontend/src/components/gateway/ConfigReview.tsx`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/pages/DeviceSetupPage.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

- [ ] **Step 1: 添加 GatewayDevice TypeScript 类型**

在 `frontend/src/types/index.ts` 文件末尾（`QuickRegisterRequest` 之后）添加以下新章节：

```typescript
// ============================================================================
// 网关设备配置
// ============================================================================

/** 网关设备配置（EdgeGateway 采集设备的连接和点位配置） */
export interface GatewayDevice {
  /** 配置记录 ID（UUID） */
  id: string;
  /** 网关标识（如 "gateway-001"） */
  gatewayId: string;
  /** 关联的已注册设备 ID（可选） */
  deviceId?: string;
  /** 设备显示名称 */
  deviceName: string;
  /** 采集协议类型（opcua / modbus-tcp / modbus-rtu） */
  protocol: string;
  /** 连接参数（JSON 字符串） */
  connectionConfig: string;
  /** 采集点位映射（JSON 字符串） */
  dataPoints: string;
  /** 轮询采集间隔（毫秒） */
  pollIntervalMs: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 创建网关设备配置请求 */
export interface CreateGatewayDeviceRequest {
  /** 网关标识 */
  gatewayId: string;
  /** 关联的已注册设备 ID */
  deviceId?: string;
  /** 设备显示名称 */
  deviceName: string;
  /** 采集协议类型 */
  protocol: string;
  /** 连接参数（JSON 字符串） */
  connectionConfig: string;
  /** 采集点位映射（JSON 字符串） */
  dataPoints: string;
  /** 轮询采集间隔（毫秒） */
  pollIntervalMs: number;
  /** 是否启用 */
  enabled: boolean;
}

/** 连接测试请求 */
export interface TestConnectionRequest {
  /** 协议类型 */
  protocol: string;
  /** 连接参数（JSON 字符串） */
  connectionConfig: string;
}

/** 连接测试响应 */
export interface TestConnectionResponse {
  /** 是否连接成功 */
  success: boolean;
  /** 结果描述信息 */
  message: string;
}
```

- [ ] **Step 2: 创建 Zod 校验 schema**

```typescript
// frontend/src/schemas/gatewayDevice.ts
import { z } from 'zod';

/**
 * OPC UA 连接参数 schema
 */
export const opcUaConnectionSchema = z.object({
  serverUrl: z.string().min(1, 'OPC UA 服务器地址不能为空').regex(
    /^opc\.tcp:\/\//,
    'OPC UA 地址必须以 opc.tcp:// 开头',
  ),
});

/**
 * Modbus TCP 连接参数 schema
 */
export const modbusTcpConnectionSchema = z.object({
  host: z.string().min(1, '主机地址不能为空'),
  port: z.number().int().min(1).max(65535).default(502),
});

/**
 * Modbus RTU 连接参数 schema
 */
export const modbusRtuConnectionSchema = z.object({
  port: z.string().min(1, '串口路径不能为空'),
  baudRate: z.number().int().default(9600),
  dataBits: z.number().int().min(5).max(8).default(8),
  parity: z.enum(['N', 'E', 'O']).default('N'),
  stopBits: z.number().int().min(1).max(2).default(1),
});

/**
 * 数据点位 schema
 */
export const dataPointSchema = z.object({
  /** 指标名称（如 temperature） */
  metric: z.string().min(1, '指标名称不能为空'),
  /** OPC UA NodeId 或 Modbus 地址 */
  pointId: z.string().min(1, '点位地址不能为空'),
});

/**
 * 网关设备配置向导完整 schema
 * 按步骤拆分，每步独立校验
 */

/** 步骤 1：选择协议 */
export const step1Schema = z.object({
  protocol: z.enum(['opcua', 'modbus-tcp', 'modbus-rtu'], {
    required_error: '请选择采集协议',
  }),
});

/** 步骤 2：配置连接 + 设备基本信息 */
export const step2Schema = z.object({
  gatewayId: z.string().min(1, '网关标识不能为空'),
  deviceName: z.string().min(1, '设备名称不能为空').max(200, '设备名称不能超过 200 字符'),
  connectionConfig: z.string().min(1, '连接参数不能为空'),
  pollIntervalMs: z.number().int().min(500).max(60000).default(3000),
});

/** 步骤 3：数据点位（至少一个点位） */
export const step3Schema = z.object({
  dataPoints: z.array(dataPointSchema).min(1, '至少添加一个数据点位'),
});

/** 完整表单数据类型（4 步合并） */
export type GatewayWizardFormData = z.infer<typeof step1Schema> &
  z.infer<typeof step2Schema> & {
    dataPoints: z.infer<typeof dataPointSchema>[];
    deviceId?: string;
  };
```

- [ ] **Step 3: 创建 useGatewayDevices hooks**

```typescript
// frontend/src/hooks/useGatewayDevices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  GatewayDevice,
  CreateGatewayDeviceRequest,
  PagedResult,
  TestConnectionRequest,
  TestConnectionResponse,
} from '../types';

// ============================================================================
// 网关设备配置列表查询
// ============================================================================

/**
 * 网关设备配置列表查询 Hook
 *
 * 支持分页和网关标识筛选。
 */
export function useGatewayDevices(
  page = 1,
  pageSize = 20,
  gatewayId?: string,
) {
  return useQuery({
    queryKey: ['gateway-devices', page, pageSize, gatewayId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (gatewayId) params.set('gatewayId', gatewayId);
      const { data } = await api.get<PagedResult<GatewayDevice>>(
        '/gateway/devices?' + params,
      );
      return data;
    },
  });
}

// ============================================================================
// 创建网关设备配置
// ============================================================================

/**
 * 创建网关设备配置 Mutation Hook
 *
 * 创建成功后自动使设备配置列表和设备列表缓存失效。
 */
export function useCreateGatewayDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateGatewayDeviceRequest) => {
      const { data } = await api.post<GatewayDevice>('/gateway/devices', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

// ============================================================================
// 更新网关设备配置
// ============================================================================

/**
 * 更新网关设备配置 Mutation Hook
 *
 * 更新成功后自动使设备配置列表缓存失效。
 */
export function useUpdateGatewayDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...request
    }: { id: string } & Partial<CreateGatewayDeviceRequest>) => {
      const { data } = await api.put<GatewayDevice>(`/gateway/devices/${id}`, request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-devices'] });
    },
  });
}

// ============================================================================
// 删除网关设备配置
// ============================================================================

/**
 * 删除网关设备配置 Mutation Hook
 *
 * 删除成功后自动使设备配置列表缓存失效。
 */
export function useDeleteGatewayDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gateway/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-devices'] });
    },
  });
}

// ============================================================================
// 测试连接
// ============================================================================

/**
 * 测试设备连接 Mutation Hook
 *
 * 向后端发送协议类型和连接参数，后端创建临时适配器尝试连接。
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: async (request: TestConnectionRequest) => {
      const { data } = await api.post<TestConnectionResponse>(
        '/gateway/devices/test-connection',
        request,
      );
      return data;
    },
  });
}
```

- [ ] **Step 4: 创建 ConnectionForm 组件**

先确认目录存在：

Run: `mkdir -p /Users/yqgmac/yqg/project/EquipSense/frontend/src/components/gateway`

```tsx
// frontend/src/components/gateway/ConnectionForm.tsx
import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/**
 * 连接参数表单 — 根据协议类型动态渲染不同的连接参数字段。
 *
 * OPC UA: 服务器地址（opc.tcp://host:port）
 * Modbus TCP: IP + 端口
 * Modbus RTU: 串口路径 + 波特率 + 数据位 + 校验位 + 停止位
 */

/** 连接参数组件的 Props */
interface ConnectionFormProps {
  /** 当前协议类型 */
  protocol: string;
  /** 连接参数 JSON 字符串 */
  connectionConfig: string;
  /** 连接参数变更回调 */
  onConnectionConfigChange: (config: string) => void;
}

/** 解析后的连接参数类型 */
type ConnectionValues = Record<string, string | number>;

/** 将 JSON 字符串解析为连接参数对象 */
function parseConnectionConfig(config: string): ConnectionValues {
  try {
    return JSON.parse(config) as ConnectionValues;
  } catch {
    return {};
  }
}

/** 将连接参数对象序列化为 JSON 字符串 */
function serializeConnectionConfig(values: ConnectionValues): string {
  return JSON.stringify(values);
}

/** 更新单个字段并触发回调 */
function updateField(
  currentConfig: string,
  field: string,
  value: string | number,
  onChange: (config: string) => void,
) {
  const values = parseConnectionConfig(currentConfig);
  values[field] = value;
  onChange(serializeConnectionConfig(values));
}

export default function ConnectionForm({
  protocol,
  connectionConfig,
  onConnectionConfigChange,
}: ConnectionFormProps) {
  const { t } = useTranslation();
  const values = parseConnectionConfig(connectionConfig);

  // OPC UA 连接表单
  if (protocol === 'opcua') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serverUrl">{t('gateway.serverUrl')} *</Label>
          <Input
            id="serverUrl"
            placeholder="opc.tcp://192.168.1.100:4840"
            value={(values.serverUrl as string) || ''}
            onChange={(e) => updateField(connectionConfig, 'serverUrl', e.target.value, onConnectionConfigChange)}
          />
          <p className="text-xs text-muted-foreground">{t('gateway.serverUrlHint')}</p>
        </div>
      </div>
    );
  }

  // Modbus TCP 连接表单
  if (protocol === 'modbus-tcp') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="host">{t('gateway.host')} *</Label>
          <Input
            id="host"
            placeholder="192.168.1.100"
            value={(values.host as string) || ''}
            onChange={(e) => updateField(connectionConfig, 'host', e.target.value, onConnectionConfigChange)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">{t('gateway.port')}</Label>
          <Input
            id="port"
            type="number"
            placeholder="502"
            value={(values.port as number) || 502}
            onChange={(e) => updateField(connectionConfig, 'port', Number(e.target.value), onConnectionConfigChange)}
          />
        </div>
      </div>
    );
  }

  // Modbus RTU 连接表单
  if (protocol === 'modbus-rtu') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serialPort">{t('gateway.serialPort')} *</Label>
          <Input
            id="serialPort"
            placeholder="/dev/ttyUSB0"
            value={(values.port as string) || ''}
            onChange={(e) => updateField(connectionConfig, 'port', e.target.value, onConnectionConfigChange)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baudRate">{t('gateway.baudRate')}</Label>
            <Input
              id="baudRate"
              type="number"
              value={(values.baudRate as number) || 9600}
              onChange={(e) => updateField(connectionConfig, 'baudRate', Number(e.target.value), onConnectionConfigChange)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataBits">{t('gateway.dataBits')}</Label>
            <Input
              id="dataBits"
              type="number"
              min={5}
              max={8}
              value={(values.dataBits as number) || 8}
              onChange={(e) => updateField(connectionConfig, 'dataBits', Number(e.target.value), onConnectionConfigChange)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parity">{t('gateway.parity')}</Label>
            <Input
              id="parity"
              placeholder="N / E / O"
              maxLength={1}
              value={(values.parity as string) || 'N'}
              onChange={(e) => updateField(connectionConfig, 'parity', e.target.value.toUpperCase(), onConnectionConfigChange)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stopBits">{t('gateway.stopBits')}</Label>
            <Input
              id="stopBits"
              type="number"
              min={1}
              max={2}
              value={(values.stopBits as number) || 1}
              onChange={(e) => updateField(connectionConfig, 'stopBits', Number(e.target.value), onConnectionConfigChange)}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 5: 创建 DataPointsForm 组件**

```tsx
// frontend/src/components/gateway/DataPointsForm.tsx
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/** 单个数据点位 */
export interface DataPointEntry {
  /** 指标名称 */
  metric: string;
  /** 点位地址（OPC UA NodeId 或 Modbus 类型:地址） */
  pointId: string;
}

/** 数据点位表单 Props */
interface DataPointsFormProps {
  /** 当前协议类型 */
  protocol: string;
  /** 数据点位列表 */
  dataPoints: DataPointEntry[];
  /** 点位列表变更回调 */
  onDataChange: (points: DataPointEntry[]) => void;
}

/**
 * 数据点位表单 — 根据协议类型提供不同的点位地址输入方式。
 *
 * OPC UA: 手动输入 NodeId
 * Modbus: 选择类型（holding_register/input_register/coil/discrete_input）+ 地址
 */

/** Modbus 寄存器类型选项 */
const MODBUS_REGISTER_TYPES = [
  { value: 'holding_register', label: 'Holding Register (功能码 03)' },
  { value: 'input_register', label: 'Input Register (功能码 04)' },
  { value: 'coil', label: 'Coil (功能码 01)' },
  { value: 'discrete_input', label: 'Discrete Input (功能码 02)' },
];

export default function DataPointsForm({
  protocol,
  dataPoints,
  onDataChange,
}: DataPointsFormProps) {
  const { t } = useTranslation();

  /** 添加一个空数据点位 */
  const addPoint = () => {
    onDataChange([...dataPoints, { metric: '', pointId: '' }]);
  };

  /** 删除指定索引的数据点位 */
  const removePoint = (index: number) => {
    onDataChange(dataPoints.filter((_, i) => i !== index));
  };

  /** 更新指定索引的数据点位字段 */
  const updatePoint = (index: number, field: keyof DataPointEntry, value: string) => {
    onDataChange(dataPoints.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('gateway.dataPointsHint')}</p>

      {/* 数据点位列表 */}
      {dataPoints.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-md border-dashed">
          {t('gateway.noDataPoints')}
        </div>
      ) : (
        <div className="space-y-3">
          {dataPoints.map((point, idx) => (
            <div key={idx} className="flex items-end gap-3 p-3 border rounded-md">
              {/* 指标名称 */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{t('gateway.metricName')}</Label>
                <Input
                  placeholder={t('gateway.metricNamePlaceholder')}
                  value={point.metric}
                  onChange={(e) => updatePoint(idx, 'metric', e.target.value)}
                />
              </div>

              {/* 点位地址 — 根据协议类型渲染不同的输入 */}
              {protocol === 'opcua' ? (
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t('gateway.nodeId')}</Label>
                  <Input
                    placeholder="ns=2;s=Temperature"
                    value={point.pointId}
                    onChange={(e) => updatePoint(idx, 'pointId', e.target.value)}
                  />
                </div>
              ) : (
                <>
                  {/* Modbus: 寄存器类型 + 地址 */}
                  <div className="w-48 space-y-1">
                    <Label className="text-xs">{t('gateway.registerType')}</Label>
                    <Select
                      value={point.pointId.split(':')[0] || 'holding_register'}
                      onValueChange={(v) => {
                        if (v != null) {
                          const addr = point.pointId.split(':')[1] || '0';
                          updatePoint(idx, 'pointId', `${v}:${addr}`);
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MODBUS_REGISTER_TYPES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">{t('gateway.address')}</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={point.pointId.split(':')[1] || ''}
                      onChange={(e) => {
                        const type = point.pointId.split(':')[0] || 'holding_register';
                        updatePoint(idx, 'pointId', `${type}:${e.target.value}`);
                      }}
                    />
                  </div>
                </>
              )}

              {/* 删除按钮 */}
              <Button variant="ghost" size="icon" onClick={() => removePoint(idx)} className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 添加数据点位按钮 */}
      <Button variant="outline" onClick={addPoint} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {t('gateway.addDataPoint')}
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: 创建 ConfigReview 组件**

```tsx
// frontend/src/components/gateway/ConfigReview.tsx
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { DataPointEntry } from './DataPointsForm';

/** 协议类型显示名称映射 */
const PROTOCOL_LABELS: Record<string, string> = {
  opcua: 'OPC UA',
  'modbus-tcp': 'Modbus TCP',
  'modbus-rtu': 'Modbus RTU',
};

/** 配置预览 Props */
interface ConfigReviewProps {
  /** 网关标识 */
  gatewayId: string;
  /** 设备名称 */
  deviceName: string;
  /** 协议类型 */
  protocol: string;
  /** 连接参数 JSON 字符串 */
  connectionConfig: string;
  /** 数据点位列表 */
  dataPoints: DataPointEntry[];
  /** 轮询间隔（毫秒） */
  pollIntervalMs: number;
  /** 连接测试结果 */
  testResult: { success: boolean; message: string } | null;
}

/**
 * 配置预览卡片 — 步骤 4 展示完整配置供用户确认后保存。
 */
export default function ConfigReview({
  gatewayId,
  deviceName,
  protocol,
  connectionConfig,
  dataPoints,
  pollIntervalMs,
  testResult,
}: ConfigReviewProps) {
  const { t } = useTranslation();

  /** 尝试解析连接参数用于展示 */
  let connectionDisplay: Record<string, string | number>;
  try {
    connectionDisplay = JSON.parse(connectionConfig);
  } catch {
    connectionDisplay = { raw: connectionConfig };
  }

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('gateway.basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('gateway.gatewayId')}：</span>
            <span className="font-medium">{gatewayId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('gateway.deviceName')}：</span>
            <span className="font-medium">{deviceName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('gateway.protocol')}：</span>
            <Badge variant="secondary">{PROTOCOL_LABELS[protocol] || protocol}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">{t('gateway.pollInterval')}：</span>
            <span className="font-medium">{pollIntervalMs}ms</span>
          </div>
        </div>
      </div>

      {/* 连接参数 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('gateway.connectionParams')}</h3>
        <div className="rounded-md border p-3 bg-muted/50 text-sm">
          {Object.entries(connectionDisplay).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="text-muted-foreground">{key}</span>
              <span className="font-mono">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 连接测试结果 */}
      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
          testResult.success
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
        }`}>
          {testResult.success
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* 数据点位列表 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          {t('gateway.dataPoints')}（{dataPoints.length}）
        </h3>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">{t('gateway.metricName')}</th>
                <th className="text-left p-2">{t('gateway.pointAddress')}</th>
              </tr>
            </thead>
            <tbody>
              {dataPoints.map((point, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{point.metric}</td>
                  <td className="p-2 font-mono text-xs">{point.pointId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: 重写 DeviceSetupPage 为 4 步向导**

完整重写 `frontend/src/pages/DeviceSetupPage.tsx`：

```tsx
// frontend/src/pages/DeviceSetupPage.tsx
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Network,
  Cpu,
  Cable,
  Radio,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import ConnectionForm from '../components/gateway/ConnectionForm';
import DataPointsForm, { type DataPointEntry } from '../components/gateway/DataPointsForm';
import ConfigReview from '../components/gateway/ConfigReview';
import {
  useCreateGatewayDevice,
  useTestConnection,
} from '../hooks/useGatewayDevices';
import { step1Schema, step2Schema, step3Schema } from '../schemas/gatewayDevice';
import type { GatewayWizardFormData } from '../schemas/gatewayDevice';

/** 向导步骤枚举 */
type WizardStep = 'protocol' | 'connection' | 'dataPoints' | 'review';

/** 协议类型选项配置 */
const PROTOCOL_OPTIONS = [
  {
    value: 'opcua' as const,
    label: 'OPC UA',
    descriptionKey: 'deviceSetup.protocolOpcUaDesc',
    icon: Network,
    color: 'text-blue-500',
  },
  {
    value: 'modbus-tcp' as const,
    label: 'Modbus TCP',
    descriptionKey: 'deviceSetup.protocolModbusTcpDesc',
    icon: Cpu,
    color: 'text-green-500',
  },
  {
    value: 'modbus-rtu' as const,
    label: 'Modbus RTU',
    descriptionKey: 'deviceSetup.protocolModbusRtuDesc',
    icon: Cable,
    color: 'text-orange-500',
  },
];

/** 步骤定义 */
const STEPS: { key: WizardStep; labelKey: string }[] = [
  { key: 'protocol', labelKey: 'deviceSetup.stepProtocol' },
  { key: 'connection', labelKey: 'deviceSetup.stepConnection' },
  { key: 'dataPoints', labelKey: 'deviceSetup.stepDataPoints' },
  { key: 'review', labelKey: 'deviceSetup.stepReview' },
];

/**
 * 设备配置向导页面
 *
 * 4 步式引导流程：
 * 1. 选择采集协议（OPC UA / Modbus TCP / Modbus RTU）
 * 2. 配置连接参数 + 测试连接
 * 3. 添加数据点位
 * 4. 确认并保存
 */
export default function DeviceSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createDevice = useCreateGatewayDevice();
  const testConnection = useTestConnection();

  /** 向导当前步骤 */
  const [step, setStep] = useState<WizardStep>('protocol');
  /** 连接测试结果 */
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  /** 表单提交错误 */
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** 表单状态管理（React Hook Form + Zod 校验） */
  const form = useForm<GatewayWizardFormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      protocol: 'opcua',
      gatewayId: 'gateway-001',
      deviceName: '',
      connectionConfig: '{}',
      pollIntervalMs: 3000,
      dataPoints: [],
    },
    mode: 'onChange',
  });

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  // =========================================================================
  // 步骤校验
  // =========================================================================

  /** 校验当前步骤是否可以前进 */
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const values = form.getValues();

    if (step === 'protocol') {
      const result = step1Schema.safeParse(values);
      return result.success;
    }

    if (step === 'connection') {
      const result = step2Schema.safeParse(values);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof GatewayWizardFormData;
          form.setError(field, { message: err.message });
        });
        return false;
      }
      return true;
    }

    if (step === 'dataPoints') {
      const result = step3Schema.safeParse(values);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof GatewayWizardFormData;
          form.setError(field, { message: err.message });
        });
        return false;
      }
      return true;
    }

    return true;
  }, [step, form]);

  // =========================================================================
  // 步骤导航
  // =========================================================================

  /** 前进到下一步 */
  const goNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;

    const nextMap: Record<WizardStep, WizardStep | null> = {
      protocol: 'connection',
      connection: 'dataPoints',
      dataPoints: 'review',
      review: null,
    };
    const next = nextMap[step];
    if (next) setStep(next);
  };

  /** 后退到上一步 */
  const goBack = () => {
    const prevMap: Record<WizardStep, WizardStep | null> = {
      protocol: null,
      connection: 'protocol',
      dataPoints: 'connection',
      review: 'dataPoints',
    };
    const prev = prevMap[step];
    if (prev) setStep(prev);
  };

  // =========================================================================
  // 连接测试
  // =========================================================================

  /** 测试设备连接 */
  const handleTestConnection = async () => {
    const values = form.getValues();
    setTestResult(null);

    try {
      const result = await testConnection.mutateAsync({
        protocol: values.protocol,
        connectionConfig: values.connectionConfig,
      });
      setTestResult({ success: result.success, message: result.message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error');
      setTestResult({ success: false, message });
    }
  };

  // =========================================================================
  // 提交保存
  // =========================================================================

  /** 提交网关设备配置 */
  const handleSubmit = async () => {
    setSubmitError(null);
    const values = form.getValues();

    try {
      // 将 dataPoints 数组转换为 JSONB 对象
      const dataPointsMap: Record<string, string> = {};
      values.dataPoints.forEach((dp) => {
        dataPointsMap[dp.metric] = dp.pointId;
      });

      await createDevice.mutateAsync({
        gatewayId: values.gatewayId,
        deviceName: values.deviceName,
        protocol: values.protocol,
        connectionConfig: values.connectionConfig,
        dataPoints: JSON.stringify(dataPointsMap),
        pollIntervalMs: values.pollIntervalMs,
        enabled: true,
      });

      navigate('/devices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error');
      setSubmitError(message);
    }
  };

  // =========================================================================
  // 渲染：步骤进度指示器
  // =========================================================================

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              idx < currentStepIndex
                ? 'bg-primary text-primary-foreground'
                : idx === currentStepIndex
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx < currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
          </div>
          <span className={`text-sm ${idx === currentStepIndex ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {t(s.labelKey)}
          </span>
          {idx < STEPS.length - 1 && <div className="w-12 h-0.5 bg-muted mx-2" />}
        </div>
      ))}
    </div>
  );

  // =========================================================================
  // 渲染：步骤 1 — 选择协议
  // =========================================================================

  const renderProtocol = () => {
    const selectedProtocol = form.watch('protocol');

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground text-center">{t('deviceSetup.selectProtocolHint')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {PROTOCOL_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedProtocol === opt.value;

            return (
              <Card
                key={opt.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => form.setValue('protocol', opt.value)}
              >
                <CardContent className="pt-6 text-center space-y-3">
                  <Icon className={`h-10 w-10 mx-auto ${opt.color}`} />
                  <h3 className="font-semibold">{opt.label}</h3>
                  <p className="text-xs text-muted-foreground">{t(opt.descriptionKey)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // =========================================================================
  // 渲染：步骤 2 — 配置连接
  // =========================================================================

  const renderConnection = () => {
    const protocol = form.watch('protocol');
    const connectionConfig = form.watch('connectionConfig');

    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* 网关标识 */}
        <div className="space-y-2">
          <Label htmlFor="gatewayId">{t('gateway.gatewayId')} *</Label>
          <Input
            id="gatewayId"
            placeholder="gateway-001"
            {...form.register('gatewayId')}
          />
          {form.formState.errors.gatewayId && (
            <p className="text-xs text-destructive">{form.formState.errors.gatewayId.message}</p>
          )}
        </div>

        {/* 设备名称 */}
        <div className="space-y-2">
          <Label htmlFor="deviceName">{t('gateway.deviceName')} *</Label>
          <Input
            id="deviceName"
            placeholder={t('gateway.deviceNamePlaceholder')}
            {...form.register('deviceName')}
          />
          {form.formState.errors.deviceName && (
            <p className="text-xs text-destructive">{form.formState.errors.deviceName.message}</p>
          )}
        </div>

        {/* 轮询间隔 */}
        <div className="space-y-2">
          <Label htmlFor="pollIntervalMs">{t('gateway.pollInterval')}</Label>
          <Input
            id="pollIntervalMs"
            type="number"
            min={500}
            max={60000}
            {...form.register('pollIntervalMs', { valueAsNumber: true })}
          />
        </div>

        {/* 协议连接参数（动态表单） */}
        <div className="space-y-2">
          <Label>{t('gateway.connectionParams')}</Label>
          <ConnectionForm
            protocol={protocol}
            connectionConfig={connectionConfig}
            onConnectionConfigChange={(config) => form.setValue('connectionConfig', config)}
          />
        </div>

        {/* 测试连接按钮 */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleTestConnection}
          disabled={testConnection.isPending}
        >
          {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Radio className="mr-2 h-4 w-4" />
          {t('gateway.testConnection')}
        </Button>

        {/* 连接测试结果 */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            testResult.success
              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
          }`}>
            {testResult.message}
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 渲染：步骤 3 — 数据点位
  // =========================================================================

  const renderDataPoints = () => {
    const protocol = form.watch('protocol');
    const dataPoints = form.watch('dataPoints') || [];

    return (
      <div className="max-w-2xl mx-auto">
        <DataPointsForm
          protocol={protocol}
          dataPoints={dataPoints}
          onDataChange={(points) => form.setValue('dataPoints', points)}
        />
        {form.formState.errors.dataPoints && (
          <p className="text-xs text-destructive mt-2">
            {form.formState.errors.dataPoints.message || t('gateway.atLeastOneDataPoint')}
          </p>
        )}
      </div>
    );
  };

  // =========================================================================
  // 渲染：步骤 4 — 确认并保存
  // =========================================================================

  const renderReview = () => {
    const values = form.getValues();

    return (
      <div className="max-w-2xl mx-auto">
        <ConfigReview
          gatewayId={values.gatewayId}
          deviceName={values.deviceName}
          protocol={values.protocol}
          connectionConfig={values.connectionConfig}
          dataPoints={values.dataPoints}
          pollIntervalMs={values.pollIntervalMs}
          testResult={testResult}
        />
      </div>
    );
  };

  // =========================================================================
  // 主渲染
  // =========================================================================

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 页头 */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('deviceSetup.title')}</h1>
      </div>

      {/* 步骤进度指示器 */}
      {renderStepper()}

      {/* 步骤内容 */}
      <Card>
        <CardContent className="pt-6">
          {step === 'protocol' && renderProtocol()}
          {step === 'connection' && renderConnection()}
          {step === 'dataPoints' && renderDataPoints()}
          {step === 'review' && renderReview()}
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {submitError && (
        <div className="mt-4 rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {submitError}
        </div>
      )}

      {/* 底部导航按钮 */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goBack} disabled={step === 'protocol'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.previous')}
        </Button>

        {step === 'review' ? (
          <Button onClick={handleSubmit} disabled={createDevice.isPending}>
            {createDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('deviceSetup.submitRegister')}
          </Button>
        ) : (
          <Button onClick={goNext}>
            {t('common.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: 添加 i18n 翻译**

在 `frontend/src/i18n/zh.json` 中，替换现有的 `"deviceSetup"` 对象并添加新的 `"gateway"` 节。

需要更新 `deviceSetup` 节为（保留所有已有键，添加新键）：

```json
"deviceSetup": {
  "title": "设备配置向导",
  "stepProtocol": "选择协议",
  "stepConnection": "配置连接",
  "stepDataPoints": "数据点位",
  "stepReview": "确认保存",
  "selectProtocolHint": "选择设备使用的工业采集协议",
  "protocolOpcUaDesc": "工业标准通信协议，适用于 PLC 和 SCADA 系统",
  "protocolModbusTcpDesc": "基于 TCP/IP 的 Modbus 协议，适用于以太网设备",
  "protocolModbusRtuDesc": "基于串口的 Modbus 协议，适用于 RS485 设备",
  "stepSelectType": "选择设备类型",
  "stepBasicInfo": "设备基本信息",
  "stepAlertRules": "告警规则配置",
  "industryFilter": "行业筛选",
  "allIndustries": "全部行业",
  "industryManufacturing": "制造业",
  "industryEnergy": "能源",
  "industryChemical": "化工",
  "industryLogistics": "物流",
  "selectedTemplate": "已选择：{{name}}",
  "noTemplateSelected": "可跳过此步骤，直接配置设备",
  "appliedTemplate": "已应用模板",
  "deviceCode": "设备编码",
  "deviceCodePlaceholder": "如 INJ-001",
  "deviceCodeHint": "设备编码在租户内必须唯一",
  "deviceName": "设备名称",
  "deviceNamePlaceholder": "如 1 号注塑机",
  "alertRulesHint": "可为设备配置默认告警规则，也可稍后在告警规则页面添加",
  "noAlertRules": "暂未添加告警规则",
  "addAlertRule": "添加告警规则",
  "parametersCount": "{{count}} 个参数",
  "submitRegister": "保存配置"
}
```

添加新的 `"gateway"` 节（与 `"deviceSetup"` 同级）：

```json
"gateway": {
  "gatewayId": "网关标识",
  "deviceName": "设备名称",
  "deviceNamePlaceholder": "如 1 号注塑机",
  "protocol": "协议类型",
  "pollInterval": "轮询间隔",
  "serverUrl": "服务器地址",
  "serverUrlHint": "OPC UA 服务器地址，格式：opc.tcp://host:port",
  "host": "主机地址",
  "port": "端口",
  "serialPort": "串口路径",
  "baudRate": "波特率",
  "dataBits": "数据位",
  "parity": "校验位",
  "stopBits": "停止位",
  "connectionParams": "连接参数",
  "testConnection": "测试连接",
  "dataPoints": "数据点位",
  "dataPointsHint": "添加需要采集的指标点位。OPC UA 输入 NodeId，Modbus 输入寄存器地址。",
  "noDataPoints": "暂未添加数据点位",
  "addDataPoint": "添加数据点位",
  "metricName": "指标名称",
  "metricNamePlaceholder": "如 temperature",
  "nodeId": "NodeId",
  "registerType": "寄存器类型",
  "address": "地址",
  "pointAddress": "点位地址",
  "basicInfo": "基本信息",
  "atLeastOneDataPoint": "至少添加一个数据点位"
}
```

在 `frontend/src/i18n/en.json` 中同步更新：

```json
"deviceSetup": {
  "title": "Device Setup Wizard",
  "stepProtocol": "Select Protocol",
  "stepConnection": "Connection",
  "stepDataPoints": "Data Points",
  "stepReview": "Review & Save",
  "selectProtocolHint": "Select the industrial protocol used by the device",
  "protocolOpcUaDesc": "Industrial standard protocol for PLCs and SCADA systems",
  "protocolModbusTcpDesc": "Modbus over TCP/IP, for Ethernet devices",
  "protocolModbusRtuDesc": "Modbus over serial port, for RS485 devices",
  "stepSelectType": "Select Device Type",
  "stepBasicInfo": "Basic Info",
  "stepAlertRules": "Alert Rules",
  "industryFilter": "Industry Filter",
  "allIndustries": "All Industries",
  "industryManufacturing": "Manufacturing",
  "industryEnergy": "Energy",
  "industryChemical": "Chemical",
  "industryLogistics": "Logistics",
  "selectedTemplate": "Selected: {{name}}",
  "noTemplateSelected": "You can skip this step",
  "appliedTemplate": "Applied Template",
  "deviceCode": "Device Code",
  "deviceCodePlaceholder": "e.g. INJ-001",
  "deviceCodeHint": "Device code must be unique within the tenant",
  "deviceName": "Device Name",
  "deviceNamePlaceholder": "e.g. Injection Molder #1",
  "alertRulesHint": "Configure default alert rules, or add later",
  "noAlertRules": "No alert rules added",
  "addAlertRule": "Add Alert Rule",
  "parametersCount": "{{count}} parameters",
  "submitRegister": "Save Configuration"
},
"gateway": {
  "gatewayId": "Gateway ID",
  "deviceName": "Device Name",
  "deviceNamePlaceholder": "e.g. Injection Molder #1",
  "protocol": "Protocol",
  "pollInterval": "Poll Interval",
  "serverUrl": "Server URL",
  "serverUrlHint": "OPC UA server address, format: opc.tcp://host:port",
  "host": "Host Address",
  "port": "Port",
  "serialPort": "Serial Port",
  "baudRate": "Baud Rate",
  "dataBits": "Data Bits",
  "parity": "Parity",
  "stopBits": "Stop Bits",
  "connectionParams": "Connection Parameters",
  "testConnection": "Test Connection",
  "dataPoints": "Data Points",
  "dataPointsHint": "Add data points to collect. Enter NodeId for OPC UA or register address for Modbus.",
  "noDataPoints": "No data points added",
  "addDataPoint": "Add Data Point",
  "metricName": "Metric Name",
  "metricNamePlaceholder": "e.g. temperature",
  "nodeId": "NodeId",
  "registerType": "Register Type",
  "address": "Address",
  "pointAddress": "Point Address",
  "basicInfo": "Basic Info",
  "atLeastOneDataPoint": "At least one data point is required"
}
```

- [ ] **Step 9: 安装新依赖（如尚未安装）**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense/frontend
npm install react-hook-form @hookform/resolvers zod
```

如果这些包已安装则跳过（npm install 已安装的包不会报错）。

- [ ] **Step 10: 构建确认前端编译通过**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense/frontend
npm run build
```

Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 11: 提交**

```bash
git add frontend/src/schemas/gatewayDevice.ts \
  frontend/src/hooks/useGatewayDevices.ts \
  frontend/src/components/gateway/ConnectionForm.tsx \
  frontend/src/components/gateway/DataPointsForm.tsx \
  frontend/src/components/gateway/ConfigReview.tsx \
  frontend/src/types/index.ts \
  frontend/src/pages/DeviceSetupPage.tsx \
  frontend/src/i18n/zh.json \
  frontend/src/i18n/en.json \
  frontend/package.json \
  frontend/package-lock.json
git commit -m "feat: 前端设备配置 4 步向导 + useGatewayDevices hooks

- GatewayDevice TypeScript 类型定义（types/index.ts）
- Zod 校验 schema：按步骤拆分（协议/连接/点位）
- useGatewayDevices: CRUD + 测试连接 5 个 hooks
- ConnectionForm: 根据协议类型动态渲染连接参数表单
- DataPointsForm: OPC UA NodeId / Modbus 寄存器地址输入
- ConfigReview: 配置预览卡片（步骤 4）
- DeviceSetupPage 重写为 4 步向导（选择协议→配置连接→数据点位→确认保存）
- 中英文 i18n 翻译（deviceSetup + gateway 节）"
```

---

## 执行顺序

```
Task 1（实体+迁移）→ Task 2（Controller）→ Task 3（测试）→ Task 4（EdgeGateway）→ Task 5（前端）
```

Task 1-3 串行（后端有依赖关系），Task 4 依赖 Task 2 的 API 端点，Task 5 依赖 Task 2 的 API 端点。Task 4 和 Task 5 在 Task 2 完成后可以并行执行。
