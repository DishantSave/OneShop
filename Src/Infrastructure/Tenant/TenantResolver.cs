using Application.Common.Tenant;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Tenant;

public class TenantResolver(IConfiguration configuration) : ITenantResolver
{
    private readonly IConfiguration _configuration = configuration;

    public Task<ITenantContext> ResolveTenantAsync(HttpContext context)
    {
        var host = context.Request.Host.Host;

        var tenantId = ResolveTenantId(host);

        var tenantSection = _configuration.GetSection(
            $"TenantResolution:Tenants:{tenantId}");

        if (!tenantSection.Exists())
        {
            throw new InvalidOperationException(
                $"Tenant '{tenantId}' is not configured.");
        }

        var tenantType = tenantSection["Type"];
        var connectionStringName = tenantSection["ConnectionStringName"];

        if (string.IsNullOrWhiteSpace(connectionStringName))
        {
            throw new InvalidOperationException(
                $"Connection string is not configured for tenant '{tenantId}'.");
        }

        var connectionString =
            _configuration.GetConnectionString(connectionStringName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Connection string '{connectionStringName}' was not found.");
        }

        var tenantContext = new TenantContext
        {
            TenantId = tenantId,
            TenantType = Enum.Parse<TenantType>(
                tenantType!,
                ignoreCase: true),
            ConnectionString = connectionString
        };

        return Task.FromResult<ITenantContext>(tenantContext);
    }

    private static string ResolveTenantId(string host)
    {
        if (host.Equals(
            "localhost",
            StringComparison.OrdinalIgnoreCase))
        {
            return "LOCAL_DB";
        }

        if (host.Equals(
            "app.oneshop.com",
            StringComparison.OrdinalIgnoreCase))
        {
            return "CLOUD_DEFAULT";
        }

        const string suffix = ".oneshop.com";

        if (host.EndsWith(
            suffix,
            StringComparison.OrdinalIgnoreCase))
        {
            var subdomain = host[..^suffix.Length];

            if (!string.IsNullOrWhiteSpace(subdomain))
            {
                return subdomain.ToUpperInvariant();
            }
        }

        throw new InvalidOperationException(
            $"Unable to resolve tenant from host '{host}'.");
    }
}