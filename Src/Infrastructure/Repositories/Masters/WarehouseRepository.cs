using Application.Common.Tenant;
using Application.DTOs.Masters.Warehouse;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class WarehouseRepository(IHttpContextAccessor httpContextAccessor) : IWarehouseRepository
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

    public async Task<IEnumerable<WarehouseDto>> GetAllWarehousesAsync(string accountId, string? companyCode = null, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT w.Sequence, w.AccountId, w.CompanyCode, c.Name AS CompanyName, w.Code, w.Name,
                   w.DisplayName, w.AddressLine1 AS AddressLineOne, w.AddressLine2 AS AddressLineTwo,
                   w.City, w.StateCode, w.CountryCode, w.PostalCode, w.Contact, w.Email,
                   w.IsTestWarehouse, w.IsActive, w.DateCreated
            FROM dbo.Warehouse AS w
            INNER JOIN dbo.Company AS c ON w.AccountId = c.AccountId AND w.CompanyCode = c.Code
            WHERE (@IsCustomer = 0 AND w.AccountId = @AccountId OR @IsCustomer = 1 AND w.IsActive = 1)
              AND (@CompanyCode IS NULL OR UPPER(w.CompanyCode) = UPPER(@CompanyCode))
            ORDER BY w.CompanyCode ASC, w.Code ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<WarehouseDto>(command);
    }

    public async Task<WarehouseDto?> GetWarehouseByCodeAsync(string accountId, string companyCode, string code, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT w.Sequence, w.AccountId, w.CompanyCode, c.Name AS CompanyName, w.Code, w.Name,
                   w.DisplayName, w.AddressLine1 AS AddressLineOne, w.AddressLine2 AS AddressLineTwo,
                   w.City, w.StateCode, w.CountryCode, w.PostalCode, w.Contact, w.Email,
                   w.IsTestWarehouse, w.IsActive, w.DateCreated
            FROM dbo.Warehouse AS w
            INNER JOIN dbo.Company AS c ON w.AccountId = c.AccountId AND w.CompanyCode = c.Code
            WHERE (@IsCustomer = 0 AND w.AccountId = @AccountId OR @IsCustomer = 1)
              AND UPPER(w.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(w.Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken);

        var warehouse = await db.QueryFirstOrDefaultAsync<WarehouseDto>(command);
        if (warehouse == null) return null;

        if (!isCustomer)
        {
            const string getAuditSql = @"
                SELECT Sequence, AccountId, CompanyCode, WarehouseCode, Field, Description, DateModified, ModifiedBy
                FROM dbo.WarehouseAuditTrail
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(WarehouseCode) = UPPER(@Code)
                ORDER BY DateModified DESC, Sequence DESC";

            var auditCmd = new CommandDefinition(
                getAuditSql,
                new { AccountId = accountId, CompanyCode = companyCode, Code = code },
                cancellationToken: cancellationToken);

            var auditTrail = (await db.QueryAsync<WarehouseAuditTrailDto>(auditCmd)).ToList();
            warehouse.Audit = auditTrail;
        }

        return warehouse;
    }

    public async Task<IEnumerable<WarehouseAuditTrailDto>> GetAllWarehousesAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, WarehouseCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.WarehouseAuditTrail
            WHERE AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(CompanyCode) = UPPER(@CompanyCode))
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<WarehouseAuditTrailDto>(command);
    }

    public async Task<bool> ExistsByWarehouseCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Warehouse
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

    public async Task<WarehousePayload> RegisterWarehouseTransactionAsync(WarehouseRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string insertSql = @"
                INSERT INTO dbo.Warehouse
                (AccountId, CompanyCode, Code, Name, DisplayName, AddressLine1, AddressLine2, City, StateCode, CountryCode, PostalCode, Contact, Email, IsTestWarehouse, IsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @Code, @Name, @DisplayName, @AddressLine1, @AddressLine2, @City, @StateCode, @CountryCode, @PostalCode, @Contact, @Email, @IsTestWarehouse, @IsActive, SYSDATETIME());";

            await db.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    DisplayName = request.DisplayName,
                    AddressLine1 = request.AddressLineOne,
                    AddressLine2 = request.AddressLineTwo,
                    City = request.City,
                    StateCode = request.StateCode,
                    CountryCode = request.CountryCode.ToUpper(),
                    PostalCode = request.PostalCode,
                    Contact = request.Contact,
                    Email = request.Email,
                    IsTestWarehouse = request.IsTestWarehouse,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.WarehouseAuditTrail
                (AccountId, CompanyCode, WarehouseCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @WarehouseCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    WarehouseCode = request.Code.ToUpper(),
                    Field = "Warehouse",
                    Description = $"Created warehouse [{request.Code}] - {request.Name}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new WarehousePayload
            {
                Success = true,
                Message = $"Warehouse [{request.Code}] created successfully."
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new WarehousePayload { Success = false, Message = $"Failed to register warehouse: {ex.Message}" };
        }
    }

    public async Task<WarehousePayload> UpdateWarehouseTransactionAsync(WarehouseRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string updateSql = @"
                UPDATE dbo.Warehouse
                SET Name = @Name,
                    DisplayName = @DisplayName,
                    AddressLine1 = @AddressLine1,
                    AddressLine2 = @AddressLine2,
                    City = @City,
                    StateCode = @StateCode,
                    CountryCode = @CountryCode,
                    PostalCode = @PostalCode,
                    Contact = @Contact,
                    Email = @Email,
                    IsTestWarehouse = @IsTestWarehouse,
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
                    DisplayName = request.DisplayName,
                    AddressLine1 = request.AddressLineOne,
                    AddressLine2 = request.AddressLineTwo,
                    City = request.City,
                    StateCode = request.StateCode,
                    CountryCode = request.CountryCode.ToUpper(),
                    PostalCode = request.PostalCode,
                    Contact = request.Contact,
                    Email = request.Email,
                    IsTestWarehouse = request.IsTestWarehouse,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.WarehouseAuditTrail
                (AccountId, CompanyCode, WarehouseCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @WarehouseCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    WarehouseCode = request.Code.ToUpper(),
                    Field = "Warehouse",
                    Description = $"Updated warehouse [{request.Code}] - Status: {(request.IsActive ? "Active" : "Inactive")}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new WarehousePayload
            {
                Success = true,
                Message = $"Warehouse [{request.Code}] updated successfully."
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new WarehousePayload { Success = false, Message = $"Failed to update warehouse: {ex.Message}" };
        }
    }

    public async Task<WarehousePayload> DeleteWarehouseTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            // Delete audit trail records first
            const string delAuditSql = @"
                DELETE FROM dbo.WarehouseAuditTrail
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(WarehouseCode) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delAuditSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            const string delWhSql = @"
                DELETE FROM dbo.Warehouse
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delWhSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new WarehousePayload { Success = true, Message = $"Warehouse [{code}] deleted successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new WarehousePayload { Success = false, Message = $"Failed to delete warehouse: {ex.Message}" };
        }
    }
}
