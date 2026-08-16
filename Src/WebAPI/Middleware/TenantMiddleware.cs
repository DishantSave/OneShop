using Infrastructure.Tenant;

namespace WebAPI.Middleware;

public class TenantMiddleware(RequestDelegate next)
{
    readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantResolver tenantResolver)
    {
        var tenantContext = await tenantResolver.ResolveTenantAsync(context);

        context.Items["TenantContext"] = tenantContext;

        await _next(context);
    }
}