using Application.Common.Tenant;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Tenant;

public class TenantResolver(IConfiguration configuration) : ITenantResolver
{
    readonly IConfiguration _configuration = configuration;

    public async Task<ITenantContext> ResolveTenantAsync(HttpContext context)
    {
        var tenantContext = new TenantContext();

        // 1. Extract tenant identifier from headers (or fallback to default cloud)
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader))
        {
            tenantContext.TenantId = tenantHeader.ToString();
        }

        // 2. Determine tenant database strategy based on configuration/metadata
        // In a real application, you might query a master registry table here using tenantContext.TenantId
        if (tenantContext.TenantId.Equals("CLIENT_SECURED", StringComparison.OrdinalIgnoreCase))
        {
            tenantContext.TenantType = TenantType.ClientSecuredNode;
            tenantContext.ConnectionString = _configuration.GetConnectionString("ClientSecuredConnection")
                ?? throw new InvalidOperationException("Secured node connection string not found.");
        }
        else if (tenantContext.TenantId.Equals("LOCAL_DB", StringComparison.OrdinalIgnoreCase))
        {
            tenantContext.TenantType = TenantType.LocalServer;
            tenantContext.ConnectionString = _configuration.GetConnectionString("LocalConnection")
                ?? throw new InvalidOperationException("Local connection string not found.");
        }
        else
        {
            // Default Cloud Database Fallback
            tenantContext.TenantType = TenantType.CloudDefault;
            tenantContext.ConnectionString = _configuration.GetConnectionString("ONESHOP")
                ?? throw new InvalidOperationException("Default cloud connection string not found.");
        }

        await Task.CompletedTask;
        return tenantContext;
    }
}