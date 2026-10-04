using Application.Common.Tenant;
using Application.DTOs.Masters.Size;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class SizeRepository(IHttpContextAccessor httpContextAccessor) : ISizeRepository
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

    public async Task<IEnumerable<SizeDto>> GetAllSizesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT s.Sequence, s.AccountId, s.CompanyCode, c.Name AS CompanyName, s.Code, s.Name,
                   s.SortOrder, s.IsActive, s.DateCreated
            FROM dbo.Size AS s
            INNER JOIN dbo.Company AS c ON s.AccountId = c.AccountId AND s.CompanyCode = c.Code
            WHERE s.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(s.CompanyCode) = UPPER(@CompanyCode))
            ORDER BY s.CompanyCode ASC, s.SortOrder ASC, s.Name ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<SizeDto>(command);
    }

    public async Task<SizeDto?> GetSizeByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT s.Sequence, s.AccountId, s.CompanyCode, c.Name AS CompanyName, s.Code, s.Name,
                   s.SortOrder, s.IsActive, s.DateCreated
            FROM dbo.Size AS s
            INNER JOIN dbo.Company AS c ON s.AccountId = c.AccountId AND s.CompanyCode = c.Code
            WHERE s.AccountId = @AccountId
              AND UPPER(s.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(s.Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var size = await db.QueryFirstOrDefaultAsync<SizeDto>(command);
        if (size == null) return null;

        const string getAuditSql = @"
            SELECT Sequence, AccountId, CompanyCode, SizeCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.SizeAuditTrail
            WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(SizeCode) = UPPER(@Code)
            ORDER BY DateModified DESC, Sequence DESC";

        var auditCmd = new CommandDefinition(
            getAuditSql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<SizeAuditTrailDto>(auditCmd)).ToList();
        size.Audit = auditTrail;

        return size;
    }

    public async Task<IEnumerable<SizeAuditTrailDto>> GetAllSizesAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, SizeCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.SizeAuditTrail
            WHERE AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(CompanyCode) = UPPER(@CompanyCode))
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<SizeAuditTrailDto>(command);
    }

    public async Task<bool> ExistsBySizeCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Size
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<SizePayload> RegisterSizeTransactionAsync(SizeRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string insertSql = @"
                INSERT INTO dbo.Size
                (AccountId, CompanyCode, Code, Name, SortOrder, IsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @Code, @Name, @SortOrder, @IsActive, SYSDATETIME());";

            await db.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    SortOrder = request.SortOrder,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.SizeAuditTrail
                (AccountId, CompanyCode, SizeCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @SizeCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    SizeCode = request.Code.ToUpper(),
                    Field = "Size",
                    Description = $"Created size [{request.Code}] - {request.Name}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new SizePayload { Success = true, Message = $"Size [{request.Code}] created successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SizePayload { Success = false, Message = $"Failed to register size: {ex.Message}" };
        }
    }

    public async Task<SizePayload> UpdateSizeTransactionAsync(SizeRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string updateSql = @"
                UPDATE dbo.Size
                SET Name = @Name,
                    SortOrder = @SortOrder,
                    IsActive = @IsActive
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(
                updateSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    SortOrder = request.SortOrder,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.SizeAuditTrail
                (AccountId, CompanyCode, SizeCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @SizeCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    SizeCode = request.Code.ToUpper(),
                    Field = "Size",
                    Description = $"Updated size [{request.Code}] - Status: {(request.IsActive ? "Active" : "Inactive")}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new SizePayload { Success = true, Message = $"Size [{request.Code}] updated successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SizePayload { Success = false, Message = $"Failed to update size: {ex.Message}" };
        }
    }

    public async Task<SizePayload> DeleteSizeTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string delAuditSql = @"
                DELETE FROM dbo.SizeAuditTrail
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(SizeCode) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delAuditSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            const string delSizeSql = @"
                DELETE FROM dbo.Size
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delSizeSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new SizePayload { Success = true, Message = $"Size [{code}] deleted successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SizePayload { Success = false, Message = $"Failed to delete size: {ex.Message}" };
        }
    }
}
