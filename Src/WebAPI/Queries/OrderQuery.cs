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
        if (cancellationToken.IsCancellationRequested)
            return [];

        try
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
        catch (OperationCanceledException)
        {
            return [];
        }
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

    [Authorize]
    [GraphQLName("shippingLabels")]
    [GraphQLDescription("Get read-only shipping labels and tracking logistics information for orders.")]
    public async Task<IEnumerable<ShippingLabelDto>> GetShippingLabelsAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [Service] IOrderService orderService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested)
            return [];

        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
            var orders = await orderService.GetOrdersAsync(accountId, companyCode, isCustomer: isCustomer, cancellationToken: cancellationToken);
            return orders.Select(MapToShippingLabel);
        }
        catch (OperationCanceledException)
        {
            return [];
        }
    }

    [Authorize]
    [GraphQLName("shippingLabelByOrderId")]
    [GraphQLDescription("Get read-only shipping label and tracking logistics information for a specific order.")]
    public async Task<ShippingLabelDto?> GetShippingLabelByOrderIdAsync(
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
        var order = await orderService.GetOrderByIdAsync(accountId, companyCode, orderId, isCustomer, cancellationToken);
        return order != null ? MapToShippingLabel(order) : null;
    }

    private static ShippingLabelDto MapToShippingLabel(OrderDto o)
    {
        var notes = o.Notes ?? string.Empty;
        var awb = string.Empty;
        var url = string.Empty;
        var facilityType = "Warehouse";
        var facilityName = o.PickupLocationName ?? string.Empty;

        if (notes.Contains("AWB:", StringComparison.OrdinalIgnoreCase))
        {
            var parts = notes.Split('|');
            foreach (var p in parts)
            {
                var trimmed = p.Trim();
                if (trimmed.StartsWith("AWB:", StringComparison.OrdinalIgnoreCase))
                    awb = trimmed[4..].Trim();
                else if (trimmed.StartsWith("URL:", StringComparison.OrdinalIgnoreCase))
                    url = trimmed[4..].Trim();
                else if (trimmed.StartsWith("Fulfilled:", StringComparison.OrdinalIgnoreCase))
                {
                    var fStr = trimmed[10..].Trim();
                    if (fStr.Contains('(') && fStr.EndsWith(')'))
                    {
                        var openParen = fStr.LastIndexOf('(');
                        facilityName = fStr[..openParen].Trim();
                        facilityType = fStr.Substring(openParen + 1, fStr.Length - openParen - 2).Trim();
                    }
                    else
                    {
                        facilityName = fStr;
                    }
                }
            }
        }

        if (string.IsNullOrWhiteSpace(awb) && !string.IsNullOrWhiteSpace(o.OrderId))
        {
            awb = $"TRK-{o.CompanyCode}-{o.OrderId.Replace("ORD-", "")}";
        }

        return new ShippingLabelDto
        {
            OrderId = o.OrderId,
            CompanyCode = o.CompanyCode,
            CompanyName = o.CompanyName,
            CustomerName = o.CustomerName ?? string.Empty,
            CustomerEmail = o.CustomerEmail ?? string.Empty,
            CustomerPhone = o.CustomerPhone ?? string.Empty,
            ShippingAddress = o.ShippingAddress ?? string.Empty,
            ShippingState = o.ShippingState ?? string.Empty,
            ShipVia = o.ShipVia ?? "Road Freight",
            DeliveryPartner = o.DeliveryPartner ?? "Delhivery",
            TrackingNumber = awb,
            TrackingUrl = url,
            FacilityType = facilityType,
            FacilityCode = o.PickupLocationCode ?? string.Empty,
            FacilityName = facilityName,
            PackageWeight = "2.5 kg",
            PackageDimensions = "30 x 20 x 15 cm",
            Status = o.Status,
            OrderDate = o.OrderDate,
            DispatchDate = (o.Status.Equals("Shipped", StringComparison.OrdinalIgnoreCase) || o.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase)) ? o.DateCreated : null,
            TotalAmount = o.TotalAmount,
            TotalItems = o.TotalItems,
            Notes = o.Notes ?? string.Empty
        };
    }
}


