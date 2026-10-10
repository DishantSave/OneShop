using System.Collections.Concurrent;
using System.Security.Claims;
using Application.Common.Tenant;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;

namespace Infrastructure.Services;

public class UserRoleResolver(IHttpContextAccessor httpContextAccessor) : IUserRoleResolver
{
    private static readonly ConcurrentDictionary<string, bool> _customerCache = new();
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

    public async Task<bool> IsCustomerAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default)
    {
        var isCustClaim = user.FindFirst("is_customer")?.Value;
        var isSellerClaim = user.FindFirst("is_seller")?.Value;

        if (isCustClaim != null && isSellerClaim != null)
        {
            return isCustClaim.Equals("true", StringComparison.OrdinalIgnoreCase)
                && !isSellerClaim.Equals("true", StringComparison.OrdinalIgnoreCase);
        }

        var accountId = user.FindFirst("account_id")?.Value;
        if (string.IsNullOrWhiteSpace(accountId))
            return false;

        if (_customerCache.TryGetValue(accountId, out var cached))
            return cached;

        try
        {
            using var db = new SqlConnection(GetConnectionString());
            const string sql = @"
                SELECT TOP 1 IsCustomerAccount, IsSellerAccount 
                FROM dbo.AccountCredential 
                WHERE AccountId = @AccountId
                UNION ALL
                SELECT TOP 1 IsCustomerAccount, IsSellerAccount 
                FROM dbo.SubAccountCredential 
                WHERE AccountId = @AccountId;";

            var row = await db.QueryFirstOrDefaultAsync<(bool IsCustomer, bool IsSeller)>(
                new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: cancellationToken));

            bool isCustomer = row.IsCustomer && !row.IsSeller;
            _customerCache[accountId] = isCustomer;
            return isCustomer;
        }
        catch
        {
            return false;
        }
    }
}
