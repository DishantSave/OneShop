namespace Application.DTOs.Order;

public record OrderItemDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string CompanyCode { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public string ItemNumber { get; init; } = string.Empty;
    public string ItemName { get; init; } = string.Empty;
    public string? ColourCode { get; init; }
    public string SizeCode { get; init; } = string.Empty;
    public string? Sku { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal TotalPrice { get; init; }
    public DateTime DateAdded { get; init; }
}

public record OrderDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string CompanyCode { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public string? ParentOrderId { get; init; }
    public string Channel { get; init; } = string.Empty;
    public string LocationType { get; init; } = string.Empty;
    public string LocationCode { get; init; } = string.Empty;
    public string LocationName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public string? CustomerName { get; init; }
    public string? CustomerEmail { get; init; }
    public string? CustomerPhone { get; init; }
    public string? ShippingAddress { get; init; }
    public int TotalItems { get; init; }
    public decimal SubTotal { get; init; }
    public decimal Tax { get; init; }
    public decimal ShippingCost { get; init; }
    public decimal Discount { get; init; }
    public decimal TotalAmount { get; init; }
    public string? Notes { get; init; }
    public DateTime OrderDate { get; init; }
    public DateTime DateCreated { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public string? ShipVia { get; init; }
    public string? DeliveryPartner { get; init; }
    public string? PickupLocationCode { get; init; }
    public string? PickupLocationName { get; init; }
    public string? ShippingState { get; init; }
    public string? PromoCode { get; init; }
    public List<OrderItemDto> Items { get; init; } = [];
    public List<OrderAuditTrailDto> AuditTrail { get; init; } = [];
    public bool CanModify => !string.Equals(Status, "Shipped", StringComparison.OrdinalIgnoreCase) &&
                             !string.Equals(Status, "Delivered", StringComparison.OrdinalIgnoreCase) &&
                             !string.Equals(Status, "Cancelled", StringComparison.OrdinalIgnoreCase);
}


