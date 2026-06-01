using EquipAI.Tests.Integration.Infrastructure;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 共享测试集合定义，确保所有控制器测试共享同一个 CustomWebApplicationFactory 实例
/// 这解决了以下问题：
/// 1. Serilog 的 ReloadableLogger.Freeze() 只能调用一次
/// 2. 避免多个 WebApplicationFactory 并行创建导致 Host 构建失败
/// 3. 统一 InMemory 数据库实例，减少资源开销
/// </summary>
[CollectionDefinition("SharedFactory", DisableParallelization = true)]
public class SharedFactoryCollection : ICollectionFixture<CustomWebApplicationFactory>
{
    // 此类不需要任何实现，仅作为 xUnit Collection 定义和 Fixture 声明的载体
}
