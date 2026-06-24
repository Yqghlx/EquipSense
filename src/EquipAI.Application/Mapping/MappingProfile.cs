using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.DTOs.Tenants;
using EquipAI.Application.DTOs.Users;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;

namespace EquipAI.Application.Mapping;

/// <summary>
/// AutoMapper 映射配置文件
/// 定义实体与 DTO 之间的映射规则，处理枚举与字符串之间的转换
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ========== 用户映射 ==========

        // User 实体 -> UserDto（Role 枚举转为字符串）
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        // CreateUserRequest -> User 实体（Role 字符串解析为枚举）
        CreateMap<CreateUserRequest, User>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom<UserRoleResolver>())
            // 以下字段由服务层或数据库填充，映射时忽略
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Skills, opt => opt.Ignore())
            .ForMember(dest => dest.Locations, opt => opt.Ignore())
            .ForMember(dest => dest.Language, opt => opt.Ignore())
            .ForMember(dest => dest.NotificationPrefs, opt => opt.Ignore())
            .ForMember(dest => dest.TokenVersion, opt => opt.Ignore())
            .ForMember(dest => dest.MustChangePassword, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Tenant, opt => opt.Ignore());

        // UpdateUserRequest -> User 实体（仅更新非空字段）
        CreateMap<UpdateUserRequest, User>()
            .ForAllMembers(opt => opt.Condition((_, _, srcMember) => srcMember != null));

        // ========== 设备映射 ==========

        // Device 实体 -> DeviceDto（Status 和 Criticality 枚举转为字符串）
        CreateMap<Device, DeviceDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Criticality, opt => opt.MapFrom(src => src.Criticality.ToString()));

        // CreateDeviceRequest -> Device 实体
        CreateMap<CreateDeviceRequest, Device>()
            .ForMember(dest => dest.Criticality, opt => opt.MapFrom<DeviceCriticalityResolver>())
            // 以下字段由服务层或数据库填充，映射时忽略
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.TypeTemplateId, opt => opt.Ignore())
            .ForMember(dest => dest.Location, opt => opt.Ignore())
            .ForMember(dest => dest.Connection, opt => opt.Ignore())
            .ForMember(dest => dest.ResponsibleUserId, opt => opt.Ignore())
            .ForMember(dest => dest.HealthScore, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.Tags, opt => opt.Ignore())
            .ForMember(dest => dest.CustomFields, opt => opt.Ignore())
            .ForMember(dest => dest.LastDataAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Tenant, opt => opt.Ignore())
            .ForMember(dest => dest.TypeTemplate, opt => opt.Ignore())
            .ForMember(dest => dest.ResponsibleUser, opt => opt.Ignore());

        // UpdateDeviceRequest -> Device 实体（仅更新非空字段，Criticality 字符串转枚举）
        CreateMap<UpdateDeviceRequest, Device>()
            .ForMember(dest => dest.Criticality, opt => opt.MapFrom((src, dest) =>
                src.Criticality != null && Enum.TryParse<DeviceCriticality>(src.Criticality, ignoreCase: true, out var c)
                    ? c
                    : dest.Criticality))
            .ForAllMembers(opt => opt.Condition((_, _, srcMember) => srcMember != null));

        // ========== 租户映射 ==========

        // Tenant 实体 -> TenantDto（Plan、Status 枚举转为字符串）
        CreateMap<Tenant, TenantDto>()
            .ForMember(dest => dest.Plan, opt => opt.MapFrom(src => src.Plan.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // Tenant 实体 -> TenantDetailDto（继承 TenantDto 映射，额外包含统计字段）
        CreateMap<Tenant, TenantDetailDto>()
            .ForMember(dest => dest.Plan, opt => opt.MapFrom(src => src.Plan.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ActiveAlertCount, opt => opt.Ignore())
            .ForMember(dest => dest.PendingWorkOrderCount, opt => opt.Ignore())
            .ForMember(dest => dest.MonthlyAnalysisCount, opt => opt.Ignore())
            .ForMember(dest => dest.AdminUsername, opt => opt.Ignore())
            .ForMember(dest => dest.AdminEmail, opt => opt.Ignore());

        // CreateTenantRequest -> Tenant 实体
        CreateMap<CreateTenantRequest, Tenant>()
            .ForMember(dest => dest.Plan, opt => opt.MapFrom<TenantPlanResolver>())
            // 以下字段由服务层或数据库填充，映射时忽略
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsolationMode, opt => opt.Ignore())
            .ForMember(dest => dest.DataRetentionDays, opt => opt.Ignore())
            .ForMember(dest => dest.WorkOrderMode, opt => opt.Ignore())
            .ForMember(dest => dest.Settings, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentDeviceCount, opt => opt.Ignore())
            .ForMember(dest => dest.CurrentUserCount, opt => opt.Ignore())
            .ForMember(dest => dest.TrialEndsAt, opt => opt.Ignore())
            .ForMember(dest => dest.SubscriptionEndsAt, opt => opt.Ignore())
            .ForMember(dest => dest.Users, opt => opt.Ignore())
            .ForMember(dest => dest.Devices, opt => opt.Ignore())
            .ForMember(dest => dest.DeviceTypeTemplates, opt => opt.Ignore());

        // UpdateTenantRequest -> Tenant 实体（仅更新非空字段，Plan 字符串转枚举）
        CreateMap<UpdateTenantRequest, Tenant>()
            .ForMember(dest => dest.Plan, opt => opt.MapFrom((src, dest) =>
                src.Plan != null && Enum.TryParse<TenantPlan>(src.Plan, ignoreCase: true, out var p)
                    ? p
                    : dest.Plan))
            .ForAllMembers(opt => opt.Condition((_, _, srcMember) => srcMember != null));

        // ========== 告警规则映射 ==========

        CreateMap<Core.Entities.AlertRule, AlertRuleDto>()
            .ForMember(dest => dest.RuleType, opt => opt.MapFrom(src => src.RuleType.ToString()))
            .ForMember(dest => dest.Severity, opt => opt.MapFrom(src => src.Severity.ToString()));

        CreateMap<CreateAlertRuleRequest, Core.Entities.AlertRule>()
            .ForMember(dest => dest.RuleType, opt => opt.MapFrom((src, _) =>
                Enum.TryParse<Core.Enums.RuleType>(src.RuleType, ignoreCase: true, out var rt)
                    ? rt : Core.Enums.RuleType.Threshold))
            .ForMember(dest => dest.Severity, opt => opt.MapFrom((src, _) =>
                Enum.TryParse<Core.Enums.AlertSeverity>(src.Severity, ignoreCase: true, out var s)
                    ? s : Core.Enums.AlertSeverity.Normal))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

        CreateMap<UpdateAlertRuleRequest, Core.Entities.AlertRule>()
            .ForMember(dest => dest.RuleType, opt => opt.MapFrom((src, dest) =>
                src.RuleType != null && Enum.TryParse<Core.Enums.RuleType>(src.RuleType, ignoreCase: true, out var rt)
                    ? rt : dest.RuleType))
            .ForMember(dest => dest.Severity, opt => opt.MapFrom((src, dest) =>
                src.Severity != null && Enum.TryParse<Core.Enums.AlertSeverity>(src.Severity, ignoreCase: true, out var s)
                    ? s : dest.Severity))
            .ForAllMembers(opt => opt.Condition((_, _, srcMember) => srcMember != null));

        // ========== 告警实例映射 ==========

        CreateMap<Core.Entities.Alert, AlertDto>()
            .ForMember(dest => dest.Severity, opt => opt.MapFrom(src => src.Severity.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Acknowledged, opt => opt.MapFrom(src => src.Status != Core.Enums.AlertStatus.Active))
            .ForMember(dest => dest.Resolved, opt => opt.MapFrom(src => src.Status == Core.Enums.AlertStatus.Resolved));

        // ========== 分析映射 ==========

        CreateMap<Core.Entities.Analysis, Analysis.DTOs.AnalysisDto>()
            .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // ========== 工单映射 ==========

        CreateMap<Core.Entities.WorkOrder, WorkOrders.DTOs.WorkOrderDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()));
    }

    /// <summary>
    /// 用户角色解析器：将字符串角色名解析为 UserRole 枚举
    /// 解析失败时默认返回 Viewer 角色
    /// </summary>
    private class UserRoleResolver : IValueResolver<CreateUserRequest, User, UserRole>
    {
        public UserRole Resolve(CreateUserRequest source, User destination, UserRole destMember, ResolutionContext context)
        {
            return Enum.TryParse<UserRole>(source.Role, ignoreCase: true, out var role) ? role : UserRole.Viewer;
        }
    }

    /// <summary>
    /// 设备关键等级解析器：将字符串解析为 DeviceCriticality 枚举
    /// 解析失败时默认返回 Normal 等级
    /// </summary>
    private class DeviceCriticalityResolver : IValueResolver<CreateDeviceRequest, Device, DeviceCriticality>
    {
        public DeviceCriticality Resolve(CreateDeviceRequest source, Device destination, DeviceCriticality destMember, ResolutionContext context)
        {
            return Enum.TryParse<DeviceCriticality>(source.Criticality, ignoreCase: true, out var criticality) ? criticality : DeviceCriticality.Normal;
        }
    }

    /// <summary>
    /// 租户套餐解析器：将字符串解析为 TenantPlan 枚举
    /// 解析失败时默认返回 Basic 套餐
    /// </summary>
    private class TenantPlanResolver : IValueResolver<CreateTenantRequest, Tenant, TenantPlan>
    {
        public TenantPlan Resolve(CreateTenantRequest source, Tenant destination, TenantPlan destMember, ResolutionContext context)
        {
            return Enum.TryParse<TenantPlan>(source.Plan, ignoreCase: true, out var plan) ? plan : TenantPlan.Basic;
        }
    }
}
