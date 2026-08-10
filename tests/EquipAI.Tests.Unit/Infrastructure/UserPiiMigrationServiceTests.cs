using System.Security.Cryptography;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 历史用户联系方式回填服务测试。
/// </summary>
public sealed class UserPiiMigrationServiceTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private SqliteConnection _connection = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();
    }

    public async Task DisposeAsync() => await _connection.DisposeAsync();

    [Fact]
    public async Task 历史明文联系方式应被加密并生成盲索引()
    {
        await using var legacyDb = CreateDbContext();
        await legacyDb.Database.EnsureCreatedAsync();
        await SeedTenantAsync(legacyDb);
        var user = await SeedUserAsync(legacyDb, "legacy@example.com", "13800138000");

        await using var encryptedDb = CreateDbContext(new PiiProtector(BuildConfiguration()));
        var service = CreateService(encryptedDb);

        await service.MigrateLegacyValuesAsync();

        var stored = await ReadStoredUserAsync(user.Username);
        stored.Email.Should().StartWith("enc:v1:").And.NotContain("legacy@example.com");
        stored.Phone.Should().StartWith("enc:v1:").And.NotContain("13800138000");
        stored.EmailHash.Should().NotBeNullOrWhiteSpace();
        stored.PhoneHash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task 已加密但缺少盲索引时重复执行应补齐且保持幂等()
    {
        var protector = new PiiProtector(BuildConfiguration());
        await using var db = CreateDbContext(protector);
        await db.Database.EnsureCreatedAsync();
        await SeedTenantAsync(db);
        var user = await SeedUserAsync(db, "encrypted@example.com", "13800138000");
        await ExecuteRawAsync(
            "UPDATE users SET email_lookup_hash = NULL, phone_lookup_hash = NULL WHERE username = $username",
            ("$username", user.Username));

        var service = CreateService(db);
        await service.MigrateLegacyValuesAsync();
        var first = await ReadStoredUserAsync(user.Username);
        await service.MigrateLegacyValuesAsync();
        var second = await ReadStoredUserAsync(user.Username);

        second.Should().Be(first);
        second.EmailHash.Should().Be(protector.CreateLookupHash("email", "encrypted@example.com"));
        second.PhoneHash.Should().Be(protector.CreateLookupHash("phone", "13800138000"));
    }

    [Fact]
    public async Task 回填失败时不得清空历史明文()
    {
        await using var legacyDb = CreateDbContext();
        await legacyDb.Database.EnsureCreatedAsync();
        await SeedTenantAsync(legacyDb);
        var user = await SeedUserAsync(legacyDb, "rollback@example.com", "13800138000");

        await using var migrationDb = CreateDbContext();
        var service = new UserPiiMigrationService(
            migrationDb,
            new ThrowingPiiProtector(),
            NullLogger<UserPiiMigrationService>.Instance);

        var act = () => service.MigrateLegacyValuesAsync();

        await act.Should().ThrowAsync<CryptographicException>();
        var stored = await ReadStoredUserAsync(user.Username);
        stored.Email.Should().Be("rollback@example.com");
        stored.Phone.Should().Be("13800138000");
    }

    private AppDbContext CreateDbContext(IPiiProtector? protector = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new AppDbContext(
            options,
            new TestTenantContext(_tenantId),
            protector);
    }

    private async Task SeedTenantAsync(AppDbContext db)
    {
        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "PII 迁移测试租户",
            Slug = $"migration-{Guid.NewGuid():N}",
            Plan = TenantPlan.Basic,
            MaxUsers = 20,
            MaxDevices = 20
        });
        await db.SaveChangesAsync();
    }

    private async Task<User> SeedUserAsync(AppDbContext db, string email, string phone)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Username = $"migration-{Guid.NewGuid():N}",
            PasswordHash = "hash",
            Email = email,
            Phone = phone,
            Role = UserRole.Viewer
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private async Task<(string? Email, string? Phone, string? EmailHash, string? PhoneHash)> ReadStoredUserAsync(
        string username)
    {
        await using var command = _connection.CreateCommand();
        command.CommandText = """
            SELECT email, phone, email_lookup_hash, phone_lookup_hash
            FROM users
            WHERE username = $username
            """;
        command.Parameters.AddWithValue("$username", username);
        await using var reader = await command.ExecuteReaderAsync();
        (await reader.ReadAsync()).Should().BeTrue();
        return (
            reader.IsDBNull(0) ? null : reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetString(2),
            reader.IsDBNull(3) ? null : reader.GetString(3));
    }

    private async Task ExecuteRawAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var command = _connection.CreateCommand();
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync();
    }

    private UserPiiMigrationService CreateService(AppDbContext db)
        => new(
            db,
            new PiiProtector(BuildConfiguration()),
            NullLogger<UserPiiMigrationService>.Instance);

    private static IConfiguration BuildConfiguration()
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ASPNETCORE_ENVIRONMENT"] = "Development",
                ["Security:PiiEncryptionKey"] = Convert.ToBase64String(new byte[32])
            })
            .Build();

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    private sealed class ThrowingPiiProtector : IPiiProtector
    {
        public string ModelCacheKey => "throwing";
        public string? Normalize(string field, string? value) => value;
        public string? Protect(string? value) => throw new CryptographicException("测试保护器故意失败");
        public string? Unprotect(string? storedValue) => storedValue;
        public string? CreateLookupHash(string field, string? value) => value;
    }
}
