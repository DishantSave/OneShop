namespace Application.DTOs.Order;

public record OrderItemRequest(
    string ItemNumber,
    string ItemName,
    string? ColourCode,
    string SizeCode,
    string? Sku,
    int Quantity,
    decimal UnitPrice
);

public record OrderRequest(
    string AccountId,
    string UserName,
    string CompanyCode,
    string OrderId,
    string? ParentOrderId,
    string Channel,
    string LocationType,
    string LocationCode,
    string Status,
    string PaymentStatus,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone,
    string? ShippingAddress,
    decimal Tax,
    decimal ShippingCost,
    decimal Discount,
    string? Notes,
    List<OrderItemRequest> Items,
    string? ShipVia = null,
    string? DeliveryPartner = null,
    string? PickupLocationCode = null,
    string? PickupLocationName = null,
    string? ShippingState = null,
    string? PromoCode = null
);

