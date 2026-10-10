using Application.Common.Tenant;
using Application.DTOs.Tax;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class StateTaxRepository(IHttpContextAccessor httpContextAccessor) : IStateTaxRepository
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

    public async Task<IEnumerable<StateTaxDto>> GetStateTaxesAsync(string accountId, string? countryCode = "IN", bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CountryCode, StateCode, StateName, TaxRate, TaxType, IsActive, DateCreated, DateModified, CreatedBy
            FROM dbo.StateTax
            WHERE (@IsCustomer = 0 AND AccountId = @AccountId OR @IsCustomer = 1 AND IsActive = 1)
              AND (@CountryCode IS NULL OR UPPER(CountryCode) = UPPER(@CountryCode))
            ORDER BY StateName ASC;";

        return await db.QueryAsync<StateTaxDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, CountryCode = countryCode, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken));
    }

    public async Task<StateTaxDto?> GetStateTaxByCodeAsync(string accountId, string stateCode, string? countryCode = "IN", bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT TOP 1 Sequence, AccountId, CountryCode, StateCode, StateName, TaxRate, TaxType, IsActive, DateCreated, DateModified, CreatedBy
            FROM dbo.StateTax
            WHERE (@IsCustomer = 0 AND AccountId = @AccountId OR @IsCustomer = 1)
              AND (UPPER(StateCode) = UPPER(@StateCode) OR UPPER(StateName) = UPPER(@StateCode))
              AND (@CountryCode IS NULL OR UPPER(CountryCode) = UPPER(@CountryCode));";

        return await db.QueryFirstOrDefaultAsync<StateTaxDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, StateCode = stateCode.Trim(), CountryCode = countryCode, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken));
    }

    public async Task<StateTaxPayload> SaveStateTaxAsync(StateTaxRequest request, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            IF EXISTS (
                SELECT 1 FROM dbo.StateTax 
                WHERE AccountId = @AccountId 
                  AND UPPER(CountryCode) = UPPER(@CountryCode) 
                  AND UPPER(StateCode) = UPPER(@StateCode)
            )
            BEGIN
                UPDATE dbo.StateTax
                SET StateName = @StateName,
                    TaxRate = @TaxRate,
                    TaxType = @TaxType,
                    IsActive = @IsActive,
                    DateModified = SYSDATETIME()
                WHERE AccountId = @AccountId 
                  AND UPPER(CountryCode) = UPPER(@CountryCode) 
                  AND UPPER(StateCode) = UPPER(@StateCode);
            END
            ELSE
            BEGIN
                INSERT INTO dbo.StateTax 
                (AccountId, CountryCode, StateCode, StateName, TaxRate, TaxType, IsActive, DateCreated, DateModified, CreatedBy)
                VALUES 
                (@AccountId, @CountryCode, @StateCode, @StateName, @TaxRate, @TaxType, @IsActive, SYSDATETIME(), SYSDATETIME(), @CreatedBy);
            END;";

        await db.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                AccountId = request.AccountId,
                CountryCode = string.IsNullOrWhiteSpace(request.CountryCode) ? "IN" : request.CountryCode.Trim().ToUpper(),
                StateCode = request.StateCode.Trim().ToUpper(),
                StateName = request.StateName.Trim(),
                TaxRate = request.TaxRate,
                TaxType = string.IsNullOrWhiteSpace(request.TaxType) ? "GST" : request.TaxType.Trim(),
                IsActive = request.IsActive,
                CreatedBy = request.UserName
            },
            cancellationToken: cancellationToken));

        var updated = await GetStateTaxByCodeAsync(request.AccountId, request.StateCode, request.CountryCode, isCustomer: false, cancellationToken);

        return new StateTaxPayload
        {
            Success = true,
            Message = $"State tax structure for [{request.StateName}] saved successfully.",
            TaxDetails = updated
        };
    }

    public async Task<StateTaxPayload> DeleteStateTaxAsync(string accountId, string stateCode, string? countryCode = "IN", CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            DELETE FROM dbo.StateTax
            WHERE AccountId = @AccountId
              AND UPPER(StateCode) = UPPER(@StateCode)
              AND (@CountryCode IS NULL OR UPPER(CountryCode) = UPPER(@CountryCode));";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = accountId, StateCode = stateCode.Trim().ToUpper(), CountryCode = countryCode },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new StateTaxPayload { Success = true, Message = $"Tax entry for [{stateCode}] deleted successfully." };
        }

        return new StateTaxPayload { Success = false, Message = $"Tax entry for [{stateCode}] was not found." };
    }
}
