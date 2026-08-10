using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 将 PII 保护器密钥指纹加入 EF Core 模型缓存键。
/// 
/// 同一进程中的测试上下文可能分别使用明文测试保护器和真实保护器；
/// 若沿用默认缓存键，先创建的 ValueConverter 可能被错误复用到另一种密钥配置。
/// </summary>
public sealed class PiiModelCacheKeyFactory : IModelCacheKeyFactory
{
    /// <inheritdoc />
    public object Create(DbContext context, bool designTime)
    {
        var piiCacheKey = context is AppDbContext appDbContext
            ? appDbContext.PiiModelCacheKey
            : "unknown";

        return new PiiModelCacheKey(context.GetType(), piiCacheKey, designTime);
    }

    private sealed record PiiModelCacheKey(Type ContextType, string PiiCacheKey, bool DesignTime);
}
