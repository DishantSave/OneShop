using Application.Common.Tenant;
using Application.DTOs.Masters.Colour;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class ColourRepository(IHttpContextAccessor httpContextAccessor) : IColourRepository
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

    public async Task<IEnumerable<ColourDto>> GetAllColoursAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT clr.Sequence, clr.AccountId, clr.CompanyCode, c.Name AS CompanyName, clr.Code, clr.Name,
                   clr.HexCode, clr.IsActive, clr.DateCreated
            FROM dbo.Colour AS clr
            INNER JOIN dbo.Company AS c ON clr.AccountId = c.AccountId AND clr.CompanyCode = c.Code
            WHERE clr.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(clr.CompanyCode) = UPPER(@CompanyCode))
            ORDER BY clr.CompanyCode ASC, clr.Name ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<ColourDto>(command);
    }

    public async Task<ColourDto?> GetColourByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT clr.Sequence, clr.AccountId, clr.CompanyCode, c.Name AS CompanyName, clr.Code, clr.Name,
                   clr.HexCode, clr.IsActive, clr.DateCreated
            FROM dbo.Colour AS clr
            INNER JOIN dbo.Company AS c ON clr.AccountId = c.AccountId AND clr.CompanyCode = c.Code
            WHERE clr.AccountId = @AccountId
              AND UPPER(clr.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(clr.Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var colour = await db.QueryFirstOrDefaultAsync<ColourDto>(command);
        if (colour == null) return null;

        const string getAuditSql = @"
            SELECT Sequence, AccountId, CompanyCode, ColourCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.ColourAuditTrail
            WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ColourCode) = UPPER(@Code)
            ORDER BY DateModified DESC, Sequence DESC";

        var auditCmd = new CommandDefinition(
            getAuditSql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<ColourAuditTrailDto>(auditCmd)).ToList();
        colour.Audit = auditTrail;

        return colour;
    }

    public async Task<IEnumerable<ColourAuditTrailDto>> GetAllColoursAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, ColourCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.ColourAuditTrail
            WHERE AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(CompanyCode) = UPPER(@CompanyCode))
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<ColourAuditTrailDto>(command);
    }

    public async Task<bool> ExistsByColourCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Colour
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

    public async Task<ColourPayload> RegisterColourTransactionAsync(ColourRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string insertSql = @"
                INSERT INTO dbo.Colour
                (AccountId, CompanyCode, Code, Name, HexCode, IsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @Code, @Name, @HexCode, @IsActive, SYSDATETIME());";

            await db.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    HexCode = request.HexCode,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.ColourAuditTrail
                (AccountId, CompanyCode, ColourCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ColourCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ColourCode = request.Code.ToUpper(),
                    Field = "Colour",
                    Description = $"Created colour [{request.Code}] - {request.Name}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new ColourPayload { Success = true, Message = $"Colour [{request.Code}] created successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ColourPayload { Success = false, Message = $"Failed to register colour: {ex.Message}" };
        }
    }

    public async Task<ColourPayload> UpdateColourTransactionAsync(ColourRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string updateSql = @"
                UPDATE dbo.Colour
                SET Name = @Name,
                    HexCode = @HexCode,
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
                    HexCode = request.HexCode,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.ColourAuditTrail
                (AccountId, CompanyCode, ColourCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ColourCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ColourCode = request.Code.ToUpper(),
                    Field = "Colour",
                    Description = $"Updated colour [{request.Code}] - Status: {(request.IsActive ? "Active" : "Inactive")}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new ColourPayload { Success = true, Message = $"Colour [{request.Code}] updated successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ColourPayload { Success = false, Message = $"Failed to update colour: {ex.Message}" };
        }
    }

    public async Task<ColourPayload> DeleteColourTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string delAuditSql = @"
                DELETE FROM dbo.ColourAuditTrail
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ColourCode) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delAuditSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            const string delClrSql = @"
                DELETE FROM dbo.Colour
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delClrSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new ColourPayload { Success = true, Message = $"Colour [{code}] deleted successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ColourPayload { Success = false, Message = $"Failed to delete colour: {ex.Message}" };
        }
    }
}
