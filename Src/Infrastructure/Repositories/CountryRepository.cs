using Application.Common.Tenant;
using Application.DTOs.Masters.Country;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories;

public class CountryRepository(IHttpContextAccessor httpContextAccessor) : ICountryRepository
{
    readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private string GetConnectionString()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null && context.Items.TryGetValue("TenantContext", out var tenantObj) && tenantObj is ITenantContext tenant)
        {
            return tenant.ConnectionString;
        }

        throw new InvalidOperationException("Tenant context could not be resolved for this request.");
    }

    public async Task<IEnumerable<CountryDto>> GetAllCountriesAsync(CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT Sequence, Country, CountryCode, ISDCode, Flag FROM dbo.CountryMaster ORDER BY Country ASC;";

        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        return await db.QueryAsync<CountryDto>(command);
    }
}