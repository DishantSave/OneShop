namespace Application.GraphQL.InputModels;

public class OrderItemInput
{
    public string ItemNumber { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? ColourCode { get; set; }
    public string SizeCode { get; set; } = "ALL";
    public string? Sku { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal? Tax { get; set; } = 0;
    public decimal? ShippingCost { get; set; } = 0;
    public decimal? Discount { get; set; } = 0;
}

public class OrderInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string? OrderId { get; set; }
    public string? ParentOrderId { get; set; }
    public string Channel { get; set; } = "Both";
    public string LocationType { get; set; } = "Store";
    public string LocationCode { get; set; } = string.Empty;
    public string? Status { get; set; } = "Pending";
    public string? PaymentStatus { get; set; } = "Unpaid";
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? ShippingAddress { get; set; }
    public decimal? Tax { get; set; } = 0;
    public decimal? OtherTax { get; set; } = 0;
    public decimal? ShippingCost { get; set; } = 0;
    public decimal? Discount { get; set; } = 0;
    public decimal? PlatformFee { get; set; } = 0.50m;
    public string? Notes { get; set; }
    public string? ShipVia { get; set; }
    public string? DeliveryPartner { get; set; }
    public string? PickupLocationCode { get; set; }
    public string? PickupLocationName { get; set; }
    public string? ShippingState { get; set; }
    public string? PromoCode { get; set; }
    public List<OrderItemInput> Items { get; set; } = [];
}

public class BatchOrderInput
{
    public List<OrderInput> Orders { get; set; } = [];
}

public class UpdateOrderDetailsInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? ShippingState { get; set; }
    public string? ShipVia { get; set; }
    public string? DeliveryPartner { get; set; }
    public string? PickupLocationCode { get; set; }
    public string? PickupLocationName { get; set; }
    public string? Notes { get; set; }
    public string? UserRole { get; set; }
}

public class AddOrderTimelineCommentInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string? UserRole { get; set; }
}
