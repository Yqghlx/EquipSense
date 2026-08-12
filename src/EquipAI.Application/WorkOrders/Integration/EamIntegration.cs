using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// EAM/CMMS 系统集成（企业资产管理系统）
/// 支持对接 IBM Maximo、SAP PM 等 EAM 系统的 REST API
///
/// 功能范围：
/// - 工单创建：将 EquipSense 工单同步到 EAM 系统，记录 ExternalId（EAM 返回的工单号）
/// - 状态同步：将 EquipSense 工单状态变更推送到 EAM 系统
///
/// 认证方式（按优先级）：
/// 1. API Key（Header 方式：X-API-Key）
/// 2. Basic Auth（Username + Password）
///
/// 集成失败时记录日志但不影响主流程（fire-and-forget 容错策略）
/// </summary>
public class EamIntegration : IWorkOrderIntegration
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EamIntegration> _logger;

    public string IntegrationType => "eam";

    public EamIntegration(IHttpClientFactory httpClientFactory, ILogger<EamIntegration> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string?> PushCreatedAsync(
        Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var eamConfig = DeserializeConfig(config);
        if (eamConfig == null || !eamConfig.Enabled)
        {
            _logger.LogWarning("EAM 集成未启用或配置无效，跳过推送");
            return null;
        }

        if (string.IsNullOrEmpty(eamConfig.Endpoint))
        {
            _logger.LogWarning("EAM Endpoint 未配置，跳过推送");
            return null;
        }

        // 构建创建工单的 API 地址
        // Maximo 格式：POST {Endpoint}/oslc/os/mxapiwo/{:sysid}
        // 通用格式：POST {Endpoint}/workorders
        var createUrl = BuildCreateUrl(eamConfig);

        // 映射优先级：EquipSense → EAM 标准
        var eamPriority = MapPriority(priority);

        // 构建请求体 — 使用通用字段名，适配大多数 EAM 系统
        var payload = new
        {
            description = title,
            assetnum = workOrderId.ToString(),    // 设备编号，简化版使用工单 ID 作为标识
            worktype = "CM",                      // Corrective Maintenance（纠正性维修）
            priority = eamPriority,
            reportedby = "EquipSense",
            externalref = workOrderId.ToString(),  // 外部引用号，用于双向关联
            source = "EquipSense"
        };

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, createUrl)
            {
                Content = JsonContent.Create(payload)
            };

            ApplyAuthentication(request, eamConfig);

            var response = await _httpClientFactory.CreateClient("WorkOrderIntegration").SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                // 从 EAM 响应中提取外部工单编号
                var externalId = ExtractExternalId(responseBody);
                _logger.LogInformation("EAM 工单创建成功: WorkOrderId={WorkOrderId}, ExternalId={ExternalId}",
                    workOrderId, externalId);
                return externalId ?? responseBody;
            }

            _logger.LogWarning("EAM 工单创建失败: Status={Status}", response.StatusCode);
            return null;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 普通网络故障可以降级，但宿主停机或消息处理超时取消必须传播给集成路由。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EAM 工单创建异常: WorkOrderId={WorkOrderId}", workOrderId);
            return null;
        }
    }

    public async Task PushStatusChangedAsync(
        Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var eamConfig = DeserializeConfig(config);
        if (eamConfig == null || !eamConfig.Enabled) return;
        if (string.IsNullOrEmpty(eamConfig.Endpoint)) return;

        // 如果没有外部 ID，无法在 EAM 中定位工单
        if (string.IsNullOrEmpty(externalId))
        {
            _logger.LogWarning("EAM 状态同步跳过：缺少 ExternalId，WorkOrderId={WorkOrderId}", workOrderId);
            return;
        }

        // 构建更新工单状态的 API 地址
        // Maximo 格式：MERGE {Endpoint}/oslc/os/mxapiwo/{externalId}
        var updateUrl = BuildUpdateUrl(eamConfig, externalId);

        // 映射状态：EquipSense → EAM 标准
        var eamStatus = MapStatus(status);

        var payload = new
        {
            status = eamStatus,
            changedate = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            changereason = $"EquipSense 状态同步：{status}"
        };

        try
        {
            using var request = new HttpRequestMessage(new HttpMethod("MERGE"), updateUrl)
            {
                Content = JsonContent.Create(payload)
            };

            ApplyAuthentication(request, eamConfig);

            var response = await _httpClientFactory.CreateClient("WorkOrderIntegration").SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("EAM 工单状态更新成功: ExternalId={ExternalId}, Status={Status}",
                    externalId, eamStatus);
            }
            else
            {
                _logger.LogWarning("EAM 工单状态更新失败: Status={StatusCode}", response.StatusCode);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 普通网络故障可以降级，但宿主停机或消息处理超时取消必须传播给集成路由。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EAM 工单状态更新异常: ExternalId={ExternalId}", externalId);
        }
    }

    /// <summary>
    /// 构建创建工单的 API 地址
    /// Maximo 使用 OSLC 格式，SAP 使用 OData 格式，通用系统使用 RESTful 格式
    /// </summary>
    private static string BuildCreateUrl(EamConfig config)
    {
        var type = config.Type?.ToLowerInvariant();
        return type switch
        {
            "maximo" => $"{config.Endpoint!.TrimEnd('/')}/oslc/os/mxapiwo",
            "sap" => $"{config.Endpoint!.TrimEnd('/')}/WorkOrderSet",
            _ => $"{config.Endpoint!.TrimEnd('/')}/workorders"
        };
    }

    /// <summary>
    /// 构建更新工单的 API 地址，包含外部工单编号
    /// </summary>
    private static string BuildUpdateUrl(EamConfig config, string externalId)
    {
        var type = config.Type?.ToLowerInvariant();
        return type switch
        {
            "maximo" => $"{config.Endpoint!.TrimEnd('/')}/oslc/os/mxapiwo/{externalId}",
            "sap" => $"{config.Endpoint!.TrimEnd('/')}/WorkOrderSet('{externalId}')",
            _ => $"{config.Endpoint!.TrimEnd('/')}/workorders/{externalId}"
        };
    }

    /// <summary>
    /// 应用认证信息到 HTTP 请求
    /// 优先使用 API Key（Header 方式），其次使用 Basic Auth
    /// </summary>
    private static void ApplyAuthentication(HttpRequestMessage request, EamConfig config)
    {
        // API Key 认证（Header 方式）
        if (!string.IsNullOrEmpty(config.ApiKey))
        {
            request.Headers.Add("X-API-Key", config.ApiKey);
            return;
        }

        // Basic Auth 认证
        if (!string.IsNullOrEmpty(config.Username) && !string.IsNullOrEmpty(config.Password))
        {
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{config.Username}:{config.Password}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        }
    }

    /// <summary>
    /// 映射优先级：EquipSense → EAM 标准数值
    /// EAM 系统通常使用数字表示优先级（1=最高，5=最低）
    /// </summary>
    private static int MapPriority(string priority) => priority switch
    {
        "Critical" => 1,
        "High" => 2,
        "Medium" => 3,
        "Low" => 4,
        _ => 3
    };

    /// <summary>
    /// 映射状态：EquipSense → EAM 标准状态码
    /// 不同 EAM 系统的状态码不同，此处使用通用映射
    /// </summary>
    private static string MapStatus(string status) => status switch
    {
        "Pending" => "WAPPR",      // Waiting Approval（待审批）
        "Assigned" => "APPR",      // Approved（已审批/已派工）
        "InProgress" => "INPRG",   // In Progress（执行中）
        "Completed" => "COMP",     // Completed（已完成）
        "Closed" => "CLOSE",       // Closed（已关闭）
        "Cancelled" => "CAN",      // Cancelled（已取消）
        _ => status
    };

    /// <summary>
    /// 从 EAM 响应体中提取外部工单编号
    /// 尝试从 JSON 响应中读取常见的工单编号字段
    /// </summary>
    private string? ExtractExternalId(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            // Maximo 返回 wonum 字段
            if (root.TryGetProperty("wonum", out var wonum))
                return wonum.GetString();

            // 通用返回 id 字段
            if (root.TryGetProperty("id", out var id))
                return id.GetString();

            // SAP 返回 WorkOrderNumber 字段
            if (root.TryGetProperty("WorkOrderNumber", out var sapNum))
                return sapNum.GetString();

            return null;
        }
        catch (Exception ex)
        {
            // JSON 解析失败，无法提取外部工单编号
            _logger.LogWarning(ex, "EAM 响应 JSON 解析失败，无法提取外部工单编号");
            return null;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static EamConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<EamConfig>(config); }
        catch { return null; }
    }
}
