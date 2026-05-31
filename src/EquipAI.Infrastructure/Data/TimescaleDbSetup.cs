using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// TimescaleDB 初始化服务
/// 应用启动时执行：创建超级表、配置压缩和保留策略
/// </summary>
public class TimescaleDbSetup
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<TimescaleDbSetup> _logger;

    public TimescaleDbSetup(AppDbContext dbContext, ILogger<TimescaleDbSetup> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 执行 TimescaleDB 初始化，幂等操作，已存在则跳过
    /// </summary>
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync(
                "CREATE EXTENSION IF NOT EXISTS timescaledb", cancellationToken);

            _logger.LogInformation("TimescaleDB 扩展已启用");

            await _dbContext.Database.ExecuteSqlRawAsync("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM timescaledb_information.hypertables
                        WHERE hypertable_name = 'device_telemetry'
                    ) THEN
                        PERFORM create_hypertable('device_telemetry', 'time',
                            chunk_time_interval => INTERVAL '1 day',
                            migrate_data => true);
                    END IF;
                END $$;
                """, cancellationToken);

            _logger.LogInformation("device_telemetry 超级表已就绪");

            await _dbContext.Database.ExecuteSqlRawAsync("""
                CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_device_time
                    ON device_telemetry (tenant_id, device_id, time DESC)
                """, cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync("""
                CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_device_metric
                    ON device_telemetry (tenant_id, device_id, metric, time DESC)
                """, cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync("""
                ALTER TABLE device_telemetry SET (
                    timescaledb.compress,
                    timescaledb.compress_segmentby = 'tenant_id, device_id',
                    timescaledb.compress_orderby = 'time DESC'
                )
                """, cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM timescaledb_information.jobs
                        WHERE proc_name = 'policy_compression'
                        AND hypertable_name = 'device_telemetry'
                    ) THEN
                        PERFORM remove_compression_policy('device_telemetry');
                    END IF;
                END $$;
                """, cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync(
                "SELECT add_compression_policy('device_telemetry', INTERVAL '7 days')",
                cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM timescaledb_information.jobs
                        WHERE proc_name = 'policy_retention'
                        AND hypertable_name = 'device_telemetry'
                    ) THEN
                        PERFORM remove_retention_policy('device_telemetry');
                    END IF;
                END $$;
                """, cancellationToken);

            await _dbContext.Database.ExecuteSqlRawAsync(
                "SELECT add_retention_policy('device_telemetry', INTERVAL '90 days')",
                cancellationToken);

            _logger.LogInformation("TimescaleDB 压缩和保留策略已配置");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TimescaleDB 初始化失败，时序功能可能不可用");
            throw;
        }
    }
}
