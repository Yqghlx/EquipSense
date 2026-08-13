using Microsoft.Data.Sqlite;

namespace EquipAI.EdgeGateway.Persistence;

/// <summary>
/// 待发送的缓冲记录
/// </summary>
/// <param name="Id">自增主键</param>
/// <param name="Topic">消息主题</param>
/// <param name="Payload">消息二进制负载</param>
/// <param name="CreatedAt">创建时间</param>
public record PendingRecord(long Id, string Topic, byte[] Payload, DateTime CreatedAt);

/// <summary>
/// SQLite 缓冲存储，用于边缘网关断网时缓存遥测数据。
/// 数据保留 7 天，超过后自动清理。
/// </summary>
public class SqliteBufferStore : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    /// <summary>
    /// 串行化共享 SQLite 连接上的所有命令、结果物化和释放操作。
    /// </summary>
    private readonly SemaphoreSlim _operationGate = new(1, 1);
    /// <summary>
    /// 标识数据库表结构是否已经完成初始化。
    /// </summary>
    private bool _initialized;
    /// <summary>
    /// 标识存储是否已经开始释放，阻止排队操作再次使用连接。
    /// </summary>
    private int _disposed;

    /// <summary>
    /// 数据保留天数，超过此天数的已发送记录将被清理
    /// </summary>
    private const int RetentionDays = 7;

    /// <summary>
    /// 初始化 SQLite 缓冲存储
    /// </summary>
    /// <param name="connectionString">
    /// SQLite 连接字符串。传入 ":memory:" 使用内存数据库（适合测试），
    /// 传入文件路径使用文件数据库。
    /// </param>
    public SqliteBufferStore(string connectionString)
    {
        _connection = new SqliteConnection(
            connectionString == ":memory:"
                ? "Data Source=:memory:"
                : $"Data Source={connectionString}");
    }

    /// <summary>
    /// 初始化数据库表结构。必须在其他操作之前调用。
    /// </summary>
    public async Task InitializeAsync()
    {
        await EnterOperationAsync();
        try
        {
            if (_initialized)
                return;

            await _connection.OpenAsync();
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = """
                CREATE TABLE IF NOT EXISTS buffer_messages (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    topic       TEXT NOT NULL,
                    payload     BLOB NOT NULL,
                    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                    is_sent     INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_buffer_pending
                    ON buffer_messages(is_sent, created_at);
                """;
            await cmd.ExecuteNonQueryAsync();
            _initialized = true;
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 将一条消息存入缓冲队列
    /// </summary>
    /// <param name="topic">消息主题（如 MQTT topic）</param>
    /// <param name="payload">消息二进制负载</param>
    /// <remarks>标记为 virtual 以便单元测试模拟 SQLite 故障（如磁盘满场景）</remarks>
    public virtual async Task StoreAsync(string topic, byte[] payload)
    {
        await EnterOperationAsync();
        try
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = "INSERT INTO buffer_messages (topic, payload) VALUES (@topic, @payload)";
            cmd.Parameters.AddWithValue("@topic", topic);
            cmd.Parameters.AddWithValue("@payload", payload);
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 获取待发送的消息列表，按创建时间升序排列
    /// </summary>
    /// <param name="limit">最大返回数量</param>
    /// <returns>待发送记录列表</returns>
    public async Task<List<PendingRecord>> GetPendingAsync(int limit)
    {
        await EnterOperationAsync();
        try
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = """
                SELECT id, topic, payload, created_at
                FROM buffer_messages
                WHERE is_sent = 0
                ORDER BY created_at ASC
                LIMIT @limit
                """;
            cmd.Parameters.AddWithValue("@limit", limit);
            var results = new List<PendingRecord>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(new PendingRecord(
                    reader.GetInt64(0),
                    reader.GetString(1),
                    (byte[])reader.GetValue(2),
                    reader.GetDateTime(3)));
            }

            return results;
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 将指定记录标记为已发送
    /// </summary>
    /// <param name="id">记录 ID</param>
    public async Task MarkAsSentAsync(long id)
    {
        await EnterOperationAsync();
        try
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = "UPDATE buffer_messages SET is_sent = 1 WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 清理超过保留天数的旧记录
    /// </summary>
    public async Task CleanupOldAsync()
    {
        await EnterOperationAsync();
        try
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = "DELETE FROM buffer_messages WHERE created_at < datetime('now', @days)";
            cmd.Parameters.AddWithValue("@days", $"-{RetentionDays} days");
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 测试辅助方法：将指定记录的创建时间设置为若干天前
    /// </summary>
    /// <param name="id">记录 ID</param>
    /// <param name="daysAgo">天数偏移（正数表示过去）</param>
    public async Task TestHelper_SetCreatedDaysAgo(long id, int daysAgo)
    {
        await EnterOperationAsync();
        try
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = "UPDATE buffer_messages SET created_at = datetime('now', @days) WHERE id = @id";
            cmd.Parameters.AddWithValue("@days", $"-{daysAgo} days");
            cmd.Parameters.AddWithValue("@id", id);
            await cmd.ExecuteNonQueryAsync();
        }
        finally
        {
            _operationGate.Release();
        }
    }

    /// <summary>
    /// 进入 SQLite 操作闸门，并在等待期间再次检查释放状态。
    /// 二次检查用于阻止已经排队的后台操作在连接关闭后继续执行。
    /// </summary>
    private async Task EnterOperationAsync()
    {
        ThrowIfDisposed();
        await _operationGate.WaitAsync();
        if (Volatile.Read(ref _disposed) != 0)
        {
            _operationGate.Release();
            ThrowIfDisposed();
        }
    }

    /// <summary>
    /// 检查存储是否已经释放。
    /// </summary>
    private void ThrowIfDisposed()
    {
        if (Volatile.Read(ref _disposed) != 0)
            throw new ObjectDisposedException(nameof(SqliteBufferStore));
    }

    /// <summary>
    /// 释放数据库连接资源
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
            return;

        await _operationGate.WaitAsync();
        try
        {
            await _connection.CloseAsync();
            await _connection.DisposeAsync();
        }
        finally
        {
            _operationGate.Release();
        }
    }
}
