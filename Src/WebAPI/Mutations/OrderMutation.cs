using Application.DTOs.Order;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class OrderMutation
{
    [Authorize]
    [GraphQLName("createOrder")]
    [GraphQLDescription("Create a new single order.")]
    public async Task<OrderPayload> CreateOrderAsync(
        OrderInput input,
        ClaimsPrincipal user,
        [Service] IOrderService orderService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var items = input.Items?.Select(x => new OrderItemRequest(
                x.ItemNumber.Trim().ToUpper(),
                x.ItemName.Trim(),
                x.ColourCode?.Trim().ToUpper(),
                string.IsNullOrWhiteSpace(x.SizeCode) ? "ALL" : x.SizeCode.Trim().ToUpper(),
                x.Sku?.Trim(),
                x.Quantity > 0 ? x.Quantity : 1,
                x.UnitPrice
            )).ToList() ?? [];

            var request = new OrderRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.OrderId?.Trim().ToUpper() ?? string.Empty,
                input.ParentOrderId?.Trim().ToUpper(),
                input.Channel?.Trim() ?? "Both",
                input.LocationType?.Trim() ?? "Store",
                input.LocationCode.Trim().ToUpper(),
                input.Status?.Trim() ?? "Pending",
                input.PaymentStatus?.Trim() ?? "Unpaid",
                input.CustomerName?.Trim(),
                input.CustomerEmail?.Trim(),
                input.CustomerPhone?.Trim(),
                input.ShippingAddress?.Trim(),
                input.Tax ?? 0,
                input.ShippingCost ?? 0,
                input.Discount ?? 0,
                input.Notes?.Trim(),
                items,
                input.ShipVia?.Trim(),
                input.DeliveryPartner?.Trim(),
                input.PickupLocationCode?.Trim()?.ToUpper(),
                input.PickupLocationName?.Trim(),
                input.ShippingState?.Trim(),
                input.PromoCode?.Trim()?.ToUpper()
            );

            return await orderService.CreateOrderAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new OrderPayload { Success = false, Message = $"An error occurred while creating order: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("createBatchOrders")]
    [GraphQLDescription("Create multiple segregated orders from a batch / cart checkout.")]
    public async Task<OrderPayload> CreateBatchOrdersAsync(
        BatchOrderInput input,
        ClaimsPrincipal user,
        [Service] IOrderService orderService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            if (input.Orders == null || input.Orders.Count == 0)
                return new OrderPayload { Success = false, Message = "No orders found in batch payload." };

            var requests = new List<OrderRequest>();

            foreach (var o in input.Orders)
            {
                var items = o.Items?.Select(x => new OrderItemRequest(
                    x.ItemNumber.Trim().ToUpper(),
                    x.ItemName.Trim(),
                    x.ColourCode?.Trim().ToUpper(),
                    string.IsNullOrWhiteSpace(x.SizeCode) ? "ALL" : x.SizeCode.Trim().ToUpper(),
                    x.Sku?.Trim(),
                    x.Quantity > 0 ? x.Quantity : 1,
                    x.UnitPrice
                )).ToList() ?? [];

                requests.Add(new OrderRequest(
                    accountId,
                    userName,
                    o.CompanyCode.Trim().ToUpper(),
                    o.OrderId?.Trim().ToUpper() ?? string.Empty,
                    o.ParentOrderId?.Trim().ToUpper(),
                    o.Channel?.Trim() ?? "Both",
                    o.LocationType?.Trim() ?? "Store",
                    o.LocationCode.Trim().ToUpper(),
                    o.Status?.Trim() ?? "Pending",
                    o.PaymentStatus?.Trim() ?? "Unpaid",
                    o.CustomerName?.Trim(),
                    o.CustomerEmail?.Trim(),
                    o.CustomerPhone?.Trim(),
                    o.ShippingAddress?.Trim(),
                    o.Tax ?? 0,
                    o.ShippingCost ?? 0,
                    o.Discount ?? 0,
                    o.Notes?.Trim(),
                    items,
                    o.ShipVia?.Trim(),
                    o.DeliveryPartner?.Trim(),
                    o.PickupLocationCode?.Trim()?.ToUpper(),
                    o.PickupLocationName?.Trim(),
                    o.ShippingState?.Trim(),
                    o.PromoCode?.Trim()?.ToUpper()
                ));
            }

            return await orderService.CreateBatchOrdersAsync(requests, cancellationToken);
        }
        catch (Exception ex)
        {
            return new OrderPayload { Success = false, Message = $"An error occurred while processing checkout: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateOrderStatus")]
    [GraphQLDescription("Update the status of an order (e.g. Confirmed, Shipped, Delivered, Cancelled).")]
    public async Task<OrderPayload> UpdateOrderStatusAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("orderId")] string orderId,
        [GraphQLName("status")] string status,
        ClaimsPrincipal user,
        [Service] IOrderService orderService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await orderService.UpdateOrderStatusAsync(accountId, companyCode, orderId, status, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new OrderPayload { Success = false, Message = $"Failed to update order status: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteOrder")]
    [GraphQLDescription("Delete an order by company code and order ID.")]
    public async Task<OrderPayload> DeleteOrderAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("orderId")] string orderId,
        ClaimsPrincipal user,
        [Service] IOrderService orderService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await orderService.DeleteOrderAsync(accountId, companyCode, orderId, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new OrderPayload { Success = false, Message = $"Failed to delete order: {ex.Message}" };
        }
    }
}
