using System.Data.Common;
using System.Text.Json;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Seeding;

/// <summary>
/// 完整演示数据播种器。
/// 只为隔离演示租户创建固定的设备、遥测、告警和工单数据；Production 默认不会调用本服务。
/// </summary>
public sealed class FullDemoDataSeeder
{
    private static readonly Guid DefaultTenantId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid SeedAirCompressorId =
        Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static readonly DemoDeviceDefinition[] DeviceDefinitions =
    [
        new(SeedAirCompressorId, "AC-001", "一号空压机", "空压机", DeviceStatus.Online, DeviceCriticality.High, 92m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000002"), "DEMO-002", "二号空压机", "空压机", DeviceStatus.Online, DeviceCriticality.High, 88m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000003"), "DEMO-003", "三号空压机", "空压机", DeviceStatus.Warning, DeviceCriticality.Critical, 71m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000004"), "DEMO-004", "一号 CNC 数控机床", "CNC 数控机床", DeviceStatus.Online, DeviceCriticality.High, 95m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000005"), "DEMO-005", "二号 CNC 数控机床", "CNC 数控机床", DeviceStatus.Online, DeviceCriticality.Normal, 90m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000006"), "DEMO-006", "一号注塑机", "注塑机", DeviceStatus.Warning, DeviceCriticality.Critical, 68m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000007"), "DEMO-007", "二号注塑机", "注塑机", DeviceStatus.Online, DeviceCriticality.High, 86m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000008"), "DEMO-008", "冷却水泵", "泵", DeviceStatus.Online, DeviceCriticality.Normal, 93m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000009"), "DEMO-009", "输送电机", "电机", DeviceStatus.Online, DeviceCriticality.Normal, 89m),
        new(Guid.Parse("40000000-0000-0000-0000-000000000010"), "DEMO-010", "备用空压机", "空压机", DeviceStatus.Offline, DeviceCriticality.Low, 78m),
    ];

    private static readonly DemoAlertDefinition[] AlertDefinitions =
    [
        new(Guid.Parse("50000000-0000-0000-0000-000000000001"), "DEMO-ALERT-001", "AC-001", "oil_temperature", 96m, 90m, AlertSeverity.High, AlertStatus.Active, 2),
        new(Guid.Parse("50000000-0000-0000-0000-000000000002"), "DEMO-ALERT-002", "DEMO-003", "vibration", 8.4m, 7m, AlertSeverity.Critical, AlertStatus.Acknowledged, 5),
        new(Guid.Parse("50000000-0000-0000-0000-000000000003"), "DEMO-ALERT-003", "DEMO-004", "vibration", 7.3m, 7m, AlertSeverity.High, AlertStatus.Resolved, 9),
        new(Guid.Parse("50000000-0000-0000-0000-000000000004"), "DEMO-ALERT-004", "DEMO-006", "melt_temperature", 346m, 340m, AlertSeverity.Critical, AlertStatus.Active, 12),
        new(Guid.Parse("50000000-0000-0000-0000-000000000005"), "DEMO-ALERT-005", "DEMO-009", "motor_current", 188m, 180m, AlertSeverity.Normal, AlertStatus.Resolved, 18),
    ];

    private static readonly DemoWorkOrderDefinition[] WorkOrderDefinitions =
    [
        new(Guid.Parse("60000000-0000-0000-0000-000000000001"), "DEMO-WO-001", "DEMO-ALERT-001", "AC-001", "检查一号空压机润滑系统", WorkOrderType.Corrective, WorkOrderStatus.PendingDispatch, WorkOrderPriority.High, "油温持续超过阈值，需检查润滑油位和冷却器。"),
        new(Guid.Parse("60000000-0000-0000-0000-000000000002"), "DEMO-WO-002", "DEMO-ALERT-002", "DEMO-003", "处理三号空压机振动超标", WorkOrderType.Predictive, WorkOrderStatus.Assigned, WorkOrderPriority.Critical, "振动趋势上升，建议优先检查轴承和联轴器对中。"),
        new(Guid.Parse("60000000-0000-0000-0000-000000000003"), "DEMO-WO-003", "DEMO-ALERT-004", "DEMO-006", "排查一号注塑机熔体温度", WorkOrderType.Corrective, WorkOrderStatus.InProgress, WorkOrderPriority.Critical, "熔体温度过高，需核查温控回路和工艺参数。"),
        new(Guid.Parse("60000000-0000-0000-0000-000000000004"), "DEMO-WO-004", "DEMO-ALERT-005", "DEMO-009", "复盘输送电机过流事件", WorkOrderType.Preventive, WorkOrderStatus.Closed, WorkOrderPriority.Medium, "已完成负载复核和接线检查，当前运行正常。"),
    ];

    private static readonly string[] TelemetryMetrics =
    [
        "oil_temperature",
        "vibration",
        "motor_current",
    ];

    private readonly AppDbContext _dbContext;
    private readonly ILogger<FullDemoDataSeeder> _logger;

    /// <summary>
    /// 初始化完整演示数据播种器。
    /// </summary>
    public FullDemoDataSeeder(
        AppDbContext dbContext,
        ILogger<FullDemoDataSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 幂等创建完整演示数据。
    /// 所有变更在同一事务内提交，避免启动失败留下半套演示数据。
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("开始播种完整演示数据集...");

        // Npgsql 生产连接启用了 EnableRetryOnFailure，显式事务必须由执行策略包裹，
        // 否则 PostgreSQL 会在第一条事务内查询时拒绝用户发起的事务。
        // 这样设计也能让瞬时连接故障从事务起点重试，而不是只重试其中一条 SQL。
        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
        await executionStrategy.ExecuteAsync(async () =>
        {
            // 执行策略重试时清除上一次失败尝试遗留的跟踪实体，避免重试把旧的 Added 状态带入新事务。
            _dbContext.ChangeTracker.Clear();
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var devices = await EnsureDevicesAsync(cancellationToken);
                await SeedTelemetryAsync(devices, cancellationToken);

                var administratorId = await _dbContext.UnfilteredSet<User>()
                    .Where(user => user.TenantId == DefaultTenantId && user.Username == "admin")
                    .Select(user => (Guid?)user.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                var technicianId = await _dbContext.UnfilteredSet<User>()
                    .Where(user => user.TenantId == DefaultTenantId && user.Username == "tech")
                    .Select(user => (Guid?)user.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                var alerts = await EnsureAlertsAsync(devices, administratorId, cancellationToken);
                await EnsureWorkOrdersAsync(devices, alerts, administratorId, technicianId, cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation(
                    "完整演示数据集播种完成：{DeviceCount} 台设备、{TelemetryCount} 条遥测、{AlertCount} 条告警、{WorkOrderCount} 条工单",
                    devices.Count,
                    DeviceDefinitions.Length * 24 * TelemetryMetrics.Length,
                    AlertDefinitions.Length,
                    WorkOrderDefinitions.Length);
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                throw;
            }
        });
    }

    /// <summary>
    /// 创建或修正演示设备，并同步默认租户设备计数。
    /// </summary>
    private async Task<Dictionary<string, Device>> EnsureDevicesAsync(CancellationToken cancellationToken)
    {
        var codes = DeviceDefinitions.Select(definition => definition.Code).ToArray();
        var devices = await _dbContext.UnfilteredSet<Device>()
            .Where(device => device.TenantId == DefaultTenantId && codes.Contains(device.DeviceCode))
            .ToDictionaryAsync(device => device.DeviceCode, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var demoStart = DemoTelemetryStart();
        foreach (var definition in DeviceDefinitions)
        {
            if (!devices.TryGetValue(definition.Code, out var device))
            {
                device = new Device
                {
                    Id = definition.Id,
                    TenantId = DefaultTenantId,
                    DeviceCode = definition.Code,
                    Name = definition.Name,
                    Type = definition.Type,
                    Manufacturer = "EquipSense Demo",
                    Model = "DEMO-1",
                    SerialNumber = $"DEMO-SN-{definition.Code}",
                    Location = JsonSerializer.Serialize(new
                    {
                        workshop = "演示车间",
                        line = $"演示产线-{(definition.Id.GetHashCode() & 3) + 1}",
                        station = definition.Name,
                    }),
                    Connection = JsonSerializer.Serialize(new
                    {
                        protocol = "mqtt",
                        topic = $"factory/demo/{definition.Code}/telemetry",
                    }),
                    Criticality = definition.Criticality,
                    DowntimeCostPerHour = definition.Criticality == DeviceCriticality.Critical ? 1200m : 600m,
                    HealthScore = definition.HealthScore,
                    Status = definition.Status,
                    LastSeenAt = demoStart.AddHours(23),
                    LastDataAt = demoStart.AddHours(23),
                    UpdatedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                };
                _dbContext.Set<Device>().Add(device);
                devices[definition.Code] = device;
            }
            else
            {
                // full 模式只操作保留编码的演示设备，确保隔离演示页面始终呈现完整状态。
                device.Name = definition.Name;
                device.Type = definition.Type;
                device.Status = definition.Status;
                device.HealthScore = definition.HealthScore;
                device.LastSeenAt = demoStart.AddHours(23);
                device.LastDataAt = demoStart.AddHours(23);
                device.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(currentTenant => currentTenant.Id == DefaultTenantId, cancellationToken);
        if (tenant != null)
        {
            tenant.CurrentDeviceCount = await _dbContext.UnfilteredSet<Device>()
                .CountAsync(device => device.TenantId == DefaultTenantId, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return devices;
    }

    /// <summary>
    /// 重建演示遥测的“昨天”窗口。
    /// 每次先删除受控 source 的旧数据，防止服务每天重启后时序表无限增长。
    /// </summary>
    private async Task SeedTelemetryAsync(
        IReadOnlyDictionary<string, Device> devices,
        CancellationToken cancellationToken)
    {
        var deviceIds = devices.Values.Select(device => device.Id).ToArray();
        await ExecuteCommandAsync(
            "DELETE FROM device_telemetry WHERE tenant_id = @tenant_id AND source = @source " +
            "AND device_id IN (" + string.Join(", ", deviceIds.Select((_, index) => $"@device_{index}")) + ")",
            new[] { ("tenant_id", (object)DefaultTenantId), ("source", (object)"demo-seed") }
                .Concat(deviceIds.Select((id, index) => ($"device_{index}", (object)id))),
            cancellationToken);

        var start = DemoTelemetryStart();
        var rows = new List<DemoTelemetryRow>(DeviceDefinitions.Length * 24 * TelemetryMetrics.Length);
        foreach (var (definition, deviceIndex) in DeviceDefinitions.Select((definition, index) => (definition, index)))
        {
            var device = devices[definition.Code];
            for (var hour = 0; hour < 24; hour++)
            {
                rows.Add(new DemoTelemetryRow(start.AddHours(hour), DefaultTenantId, device.Id, "oil_temperature",
                    62 + deviceIndex * 0.7 + Math.Sin(hour / 3d) * 3 + (definition.Status == DeviceStatus.Warning && hour >= 18 ? 28 : 0)));
                rows.Add(new DemoTelemetryRow(start.AddHours(hour), DefaultTenantId, device.Id, "vibration",
                    2.1 + deviceIndex * 0.08 + Math.Abs(Math.Sin(hour / 4d)) + (definition.Status == DeviceStatus.Warning && hour >= 18 ? 4.8 : 0)));
                rows.Add(new DemoTelemetryRow(start.AddHours(hour), DefaultTenantId, device.Id, "motor_current",
                    86 + deviceIndex * 2.1 + Math.Abs(Math.Sin(hour / 5d)) * 8 + (definition.Status == DeviceStatus.Warning && hour >= 18 ? 72 : 0)));
            }
        }

        foreach (var chunk in rows.Chunk(180))
            await InsertTelemetryChunkAsync(chunk, cancellationToken);
    }

    /// <summary>
    /// 用参数化批量 INSERT 写入 keyless 时序实体，避免逐条数据库往返。
    /// </summary>
    private async Task InsertTelemetryChunkAsync(
        IEnumerable<DemoTelemetryRow> rows,
        CancellationToken cancellationToken)
    {
        var rowList = rows.ToArray();
        var values = new List<string>(rowList.Length);
        var parameters = new List<(string Name, object Value)>(rowList.Length * 7);

        for (var index = 0; index < rowList.Length; index++)
        {
            var row = rowList[index];
            var prefix = $"row_{index}_";
            values.Add($"(@{prefix}time, @{prefix}tenant, @{prefix}device, @{prefix}metric, @{prefix}value, @{prefix}quality, @{prefix}source)");
            parameters.Add(($"{prefix}time", row.Time));
            parameters.Add(($"{prefix}tenant", row.TenantId));
            parameters.Add(($"{prefix}device", row.DeviceId));
            parameters.Add(($"{prefix}metric", row.Metric));
            parameters.Add(($"{prefix}value", row.Value));
            parameters.Add(($"{prefix}quality", "good"));
            parameters.Add(($"{prefix}source", "demo-seed"));
        }

        await ExecuteCommandAsync(
            "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) VALUES " +
            string.Join(", ", values),
            parameters,
            cancellationToken);
    }

    /// <summary>
    /// 创建固定编码的五条告警，并根据当前生命周期补齐确认/解决字段。
    /// </summary>
    private async Task<Dictionary<string, Alert>> EnsureAlertsAsync(
        IReadOnlyDictionary<string, Device> devices,
        Guid? administratorId,
        CancellationToken cancellationToken)
    {
        var codes = AlertDefinitions.Select(definition => definition.Code).ToArray();
        var alerts = await _dbContext.UnfilteredSet<Alert>()
            .Where(alert => alert.TenantId == DefaultTenantId && codes.Contains(alert.AlertCode))
            .ToDictionaryAsync(alert => alert.AlertCode, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var rules = await _dbContext.UnfilteredSet<AlertRule>()
            .Where(rule => rule.TenantId == DefaultTenantId)
            .GroupBy(rule => rule.Metric)
            .Select(group => group.First())
            .ToDictionaryAsync(rule => rule.Metric, StringComparer.OrdinalIgnoreCase, cancellationToken);

        foreach (var definition in AlertDefinitions)
        {
            if (alerts.ContainsKey(definition.Code))
                continue;

            var occurredAt = DateTime.UtcNow.AddHours(-definition.HoursAgo);
            var alert = new Alert
            {
                Id = definition.Id,
                TenantId = DefaultTenantId,
                AlertCode = definition.Code,
                RuleId = rules.TryGetValue(definition.Metric, out var rule) ? rule.Id : null,
                DeviceId = devices[definition.DeviceCode].Id,
                Severity = definition.Severity,
                Status = definition.Status,
                Metric = definition.Metric,
                Value = definition.Value,
                Threshold = definition.Threshold,
                Message = $"演示告警：{definition.Metric} 超过阈值",
                DataSnapshot = JsonSerializer.Serialize(new
                {
                    source = "demo-seed",
                    deviceCode = definition.DeviceCode,
                    metric = definition.Metric,
                    value = definition.Value,
                }),
                TriggerCount = 1,
                WindowStartAt = occurredAt,
                OccurredAt = occurredAt,
                CreatedAt = occurredAt,
            };

            if (definition.Status is AlertStatus.Acknowledged or AlertStatus.Resolved)
            {
                alert.AcknowledgedBy = administratorId;
                alert.AcknowledgedAt = occurredAt.AddMinutes(8);
                alert.AcknowledgementNote = "演示流程：已接管并安排检查";
            }

            if (definition.Status == AlertStatus.Resolved)
            {
                alert.ResolvedBy = administratorId;
                alert.ResolvedAt = occurredAt.AddHours(1);
                alert.Resolution = "演示流程：已完成检查并恢复运行";
            }

            _dbContext.Set<Alert>().Add(alert);
            alerts[definition.Code] = alert;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return alerts;
    }

    /// <summary>
    /// 创建固定工单和一条创建日志，覆盖主要工单生命周期状态。
    /// </summary>
    private async Task EnsureWorkOrdersAsync(
        IReadOnlyDictionary<string, Device> devices,
        IReadOnlyDictionary<string, Alert> alerts,
        Guid? administratorId,
        Guid? technicianId,
        CancellationToken cancellationToken)
    {
        var codes = WorkOrderDefinitions.Select(definition => definition.Code).ToArray();
        var workOrders = await _dbContext.UnfilteredSet<WorkOrder>()
            .Where(order => order.TenantId == DefaultTenantId && codes.Contains(order.WorkOrderCode))
            .ToDictionaryAsync(order => order.WorkOrderCode, StringComparer.OrdinalIgnoreCase, cancellationToken);

        foreach (var definition in WorkOrderDefinitions)
        {
            if (workOrders.ContainsKey(definition.Code))
                continue;

            var createdAt = DateTime.UtcNow.AddHours(-definition.HoursAgo);
            var order = new WorkOrder
            {
                Id = definition.Id,
                TenantId = DefaultTenantId,
                WorkOrderCode = definition.Code,
                Title = definition.Title,
                Type = definition.Type,
                Status = definition.Status,
                Priority = definition.Priority,
                DeviceId = devices[definition.DeviceCode].Id,
                AlertId = alerts[definition.AlertCode].Id,
                RootCause = definition.RootCause,
                AssignedTo = definition.Status == WorkOrderStatus.PendingDispatch ? null : technicianId,
                DueDate = createdAt.AddDays(1),
                StartedAt = definition.Status is WorkOrderStatus.InProgress or WorkOrderStatus.Closed
                    ? createdAt.AddHours(2)
                    : null,
                CompletedAt = definition.Status == WorkOrderStatus.Closed ? createdAt.AddHours(4) : null,
                ClosedAt = definition.Status == WorkOrderStatus.Closed ? createdAt.AddHours(5) : null,
                CreatedBy = administratorId,
                CreatedAt = createdAt,
            };

            _dbContext.Set<WorkOrder>().Add(order);
            workOrders[definition.Code] = order;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var workOrderIds = workOrders.Values.Select(order => order.Id).ToArray();
        var existingLogOrderIds = (await _dbContext.UnfilteredSet<WorkOrderLog>()
            .Where(log => workOrderIds.Contains(log.WorkOrderId) && log.Action == WorkOrderLogAction.Created)
            .Select(log => log.WorkOrderId)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        foreach (var definition in WorkOrderDefinitions)
        {
            var order = workOrders[definition.Code];
            if (existingLogOrderIds.Contains(order.Id))
                continue;

            _dbContext.Set<WorkOrderLog>().Add(new WorkOrderLog
            {
                Id = FixedLogId(definition.Id),
                WorkOrderId = order.Id,
                Action = WorkOrderLogAction.Created,
                NewStatus = order.Status.ToString(),
                OperatorId = administratorId,
                Note = "完整演示数据：创建工单",
                CreatedAt = order.CreatedAt,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// 执行带参数的数据库命令，并复用当前事务。
    /// </summary>
    private async Task ExecuteCommandAsync(
        string commandText,
        IEnumerable<(string Name, object Value)> parameterValues,
        CancellationToken cancellationToken)
    {
        await using var command = _dbContext.Database.GetDbConnection().CreateCommand();
        command.CommandText = commandText;
        if (_dbContext.Database.CurrentTransaction != null)
            command.Transaction = _dbContext.Database.CurrentTransaction.GetDbTransaction();

        foreach (var (name, value) in parameterValues)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = name;
            parameter.Value = value;
            command.Parameters.Add(parameter);
        }

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Guid FixedLogId(Guid workOrderId)
    {
        var bytes = workOrderId.ToByteArray();
        bytes[0] ^= 0xA5;
        return new Guid(bytes);
    }

    private static DateTime DemoTelemetryStart()
    {
        return DateTime.SpecifyKind(DateTime.UtcNow.Date.AddDays(-1), DateTimeKind.Utc);
    }

    private sealed record DemoDeviceDefinition(
        Guid Id,
        string Code,
        string Name,
        string Type,
        DeviceStatus Status,
        DeviceCriticality Criticality,
        decimal HealthScore);

    private sealed record DemoAlertDefinition(
        Guid Id,
        string Code,
        string DeviceCode,
        string Metric,
        decimal Value,
        decimal Threshold,
        AlertSeverity Severity,
        AlertStatus Status,
        int HoursAgo);

    private sealed record DemoWorkOrderDefinition(
        Guid Id,
        string Code,
        string AlertCode,
        string DeviceCode,
        string Title,
        WorkOrderType Type,
        WorkOrderStatus Status,
        WorkOrderPriority Priority,
        string RootCause,
        int HoursAgo = 0);

    private sealed record DemoTelemetryRow(
        DateTime Time,
        Guid TenantId,
        Guid DeviceId,
        string Metric,
        double Value);
}
