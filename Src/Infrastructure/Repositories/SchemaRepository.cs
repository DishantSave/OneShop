using Application.Common.Tenant;
using Application.DTOs.Schema;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories;

public class SchemaRepository(IHttpContextAccessor httpContextAccessor) : ISchemaRepository
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

    public async Task<IEnumerable<SchemaVersionDto>> GetAllSchemaVersionsAsync(CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT * FROM dbo.SchemaVersion ORDER BY DateCreated DESC;";
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        return await db.QueryAsync<SchemaVersionDto>(command);
    }

    public async Task<SchemaVersionDto?> GetLatestSchemaVersionAsync(CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT TOP 1 * FROM dbo.SchemaVersion ORDER BY DateCreated DESC;";
        var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
        return await db.QueryFirstOrDefaultAsync<SchemaVersionDto>(command);
    }
}