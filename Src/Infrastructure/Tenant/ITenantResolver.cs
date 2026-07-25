using Application.Common.Tenant;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Tenant;

public interface ITenantResolver
{
    Task<ITenantContext> ResolveTenantAsync(HttpContext context);
}