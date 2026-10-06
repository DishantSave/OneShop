using Application.DTOs.Order;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class OrderQuery
{
    [Authorize]
    [GraphQLName("orders")]
    [GraphQLDescription("Get all orders for the current account with optional company, status, location, and channel filters.")]
    public async Task<IEnumerable<OrderDto>> GetOrdersAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("status")] string? status,
        [GraphQLName("locationCode")] string? locationCode,
        [GraphQLName("channel")] string? channel,
        [Service] IOrderService orderService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await orderService.GetOrdersAsync(accountId, companyCode, status, locationCode, channel, cancellationToken);
    }

    [Authorize]
    [GraphQLName("orderById")]
    [GraphQLDescription("Get a specific order by company code and order ID.")]
    public async Task<OrderDto?> GetOrderByIdAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("orderId")] string orderId,
        [Service] IOrderService orderService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await orderService.GetOrderByIdAsync(accountId, companyCode, orderId, cancellationToken);
    }
}
