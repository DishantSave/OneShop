using Application.DTOs.Order;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class OrderQuery
{
    [Authorize]
    [GraphQLName("orders")]
    [GraphQLDescription("Get all orders for the current account with optional company, status, location, channel, and createdBy filters.")]
    public async Task<IEnumerable<OrderDto>> GetOrdersAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("status")] string? status,
        [GraphQLName("locationCode")] string? locationCode,
        [GraphQLName("channel")] string? channel,
        [GraphQLName("createdBy")] string? createdBy,
        [Service] IOrderService orderService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        var userName = user.FindFirst(ClaimTypes.Name)?.Value ?? user.FindFirst("user_name")?.Value ?? user.FindFirst("username")?.Value;
        if (isCustomer && string.IsNullOrWhiteSpace(createdBy))
        {
            createdBy = userName;
        }

        return await orderService.GetOrdersAsync(accountId, companyCode, status, locationCode, channel, createdBy, isCustomer, cancellationToken);
    }

    [Authorize]
    [GraphQLName("orderById")]
    [GraphQLDescription("Get a specific order by company code and order ID.")]
    public async Task<OrderDto?> GetOrderByIdAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("orderId")] string orderId,
        [Service] IOrderService orderService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        return await orderService.GetOrderByIdAsync(accountId, companyCode, orderId, isCustomer, cancellationToken);
    }

    [Authorize]
    [GraphQLName("orderAuditTrail")]
    [GraphQLDescription("Get audit trail timeline entries for a specific order.")]
    public async Task<IEnumerable<OrderAuditTrailDto>> GetOrderAuditTrailAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("orderId")] string orderId,
        [Service] IOrderService orderService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        return await orderService.GetOrderAuditTrailAsync(accountId, companyCode, orderId, isCustomer, cancellationToken);
    }
}


