namespace EquipAI.Core.Enums;

/// <summary>
/// 租户数据隔离模式枚举
/// </summary>
public enum TenantIsolationMode
{
    /// <summary>共享数据库，通过 tenant_id 行级隔离</summary>
    Shared,

    /// <summary>独立 Schema 隔离</summary>
    Schema,

    /// <summary>独立数据库隔离</summary>
    Database
}
