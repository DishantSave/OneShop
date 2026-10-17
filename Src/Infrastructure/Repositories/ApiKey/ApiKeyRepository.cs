using Application.Common.Tenant;
using Application.DTOs.ApiKey;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.ApiKey;

public class ApiKeyRepository(IHttpContextAccessor httpContextAccessor) : IApiKeyRepository
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private string GetConnectionString()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null && context.Items.TryGetValue("TenantContext", out var tenantObj) && tenantObj is ITenantContext tenant)
        {
            return tenant.ConnectionString;
        }

        throw new InvalidOperationException("Tenant context could not be resolved for this request.");
    }

    private static async Task EnsureTableExistsAsync(IDbConnection db, CancellationToken cancellationToken = default)
    {
        const string checkSql = @"
            IF OBJECT_ID('dbo.ApiKey', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ApiKey (
                    KeyId NVARCHAR(100) NOT NULL PRIMARY KEY,
                    AccountId NVARCHAR(100) NOT NULL,
                    Name NVARCHAR(200) NOT NULL,
                    ApiKeyMasked NVARCHAR(100) NOT NULL,
                    ApiToken NVARCHAR(MAX) NOT NULL,
                    Permissions NVARCHAR(500) NOT NULL,
                    Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
                    DateCreated DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                    ExpiresAt DATETIME2 NULL,
                    LastUsed DATETIME2 NULL,
                    CreatedBy NVARCHAR(100) NOT NULL
                );
            END";

        await db.ExecuteAsync(new CommandDefinition(checkSql, cancellationToken: cancellationToken));
    }

    public async Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync(string accountId, CancellationToken cancellationToken = default)
    {
        if (cancellationToken.IsCancellationRequested)
            return [];

        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                SELECT KeyId, AccountId, Name, ApiKeyMasked, ApiToken, Permissions,
                       Status, DateCreated, ExpiresAt, LastUsed, CreatedBy
                FROM dbo.ApiKey
                WHERE AccountId = @AccountId
                ORDER BY DateCreated DESC;";

            return await db.QueryAsync<ApiKeyDto>(new CommandDefinition(
                sql,
                new { AccountId = accountId },
                cancellationToken: cancellationToken));
        }
        catch (OperationCanceledException)
        {
            return [];
        }
    }

    public async Task<ApiKeyDto?> GetApiKeyByIdAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        if (cancellationToken.IsCancellationRequested)
            return null;

        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                SELECT TOP 1 KeyId, AccountId, Name, ApiKeyMasked, ApiToken, Permissions,
                             Status, DateCreated, ExpiresAt, LastUsed, CreatedBy
                FROM dbo.ApiKey
                WHERE AccountId = @AccountId AND KeyId = @KeyId;";

            return await db.QueryFirstOrDefaultAsync<ApiKeyDto>(new CommandDefinition(
                sql,
                new { AccountId = accountId, KeyId = keyId },
                cancellationToken: cancellationToken));
        }
        catch (OperationCanceledException)
        {
            return null;
        }
    }

    public async Task<bool> CreateApiKeyAsync(ApiKeyDto apiKey, CancellationToken cancellationToken = default)
    {
        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                INSERT INTO dbo.ApiKey
                (KeyId, AccountId, Name, ApiKeyMasked, ApiToken, Permissions, Status, DateCreated, ExpiresAt, LastUsed, CreatedBy)
                VALUES
                (@KeyId, @AccountId, @Name, @ApiKeyMasked, @ApiToken, @Permissions, @Status, @DateCreated, @ExpiresAt, @LastUsed, @CreatedBy);";

            var rows = await db.ExecuteAsync(new CommandDefinition(
                sql,
                apiKey,
                cancellationToken: cancellationToken));

            return rows > 0;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }

    public async Task<bool> RevokeApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                UPDATE dbo.ApiKey
                SET Status = 'Revoked'
                WHERE AccountId = @AccountId AND KeyId = @KeyId;";

            var rows = await db.ExecuteAsync(new CommandDefinition(
                sql,
                new { AccountId = accountId, KeyId = keyId },
                cancellationToken: cancellationToken));

            return rows > 0;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }

    public async Task<bool> DeleteApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                DELETE FROM dbo.ApiKey
                WHERE AccountId = @AccountId AND KeyId = @KeyId;";

            var rows = await db.ExecuteAsync(new CommandDefinition(
                sql,
                new { AccountId = accountId, KeyId = keyId },
                cancellationToken: cancellationToken));

            return rows > 0;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }

    public async Task UpdateLastUsedAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());
            await EnsureTableExistsAsync(db, cancellationToken);

            const string sql = @"
                UPDATE dbo.ApiKey
                SET LastUsed = SYSDATETIME()
                WHERE AccountId = @AccountId AND KeyId = @KeyId;";

            await db.ExecuteAsync(new CommandDefinition(
                sql,
                new { AccountId = accountId, KeyId = keyId },
                cancellationToken: cancellationToken));
        }
        catch
        {
            // Non-critical background telemetry
        }
    }
}
