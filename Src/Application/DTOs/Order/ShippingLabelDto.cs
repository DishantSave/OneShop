namespace Application.DTOs.Order;

public record ShippingLabelDto
{
    public string OrderId { get; init; } = string.Empty;
    public string CompanyCode { get; init; } = string.Empty;
    public string CompanyName { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string ShippingAddress { get; init; } = string.Empty;
    public string ShippingState { get; init; } = string.Empty;
    public string ShipVia { get; init; } = "Road Freight";
    public string DeliveryPartner { get; init; } = "Delhivery";
    public string TrackingNumber { get; init; } = string.Empty;
    public string TrackingUrl { get; init; } = string.Empty;
    public string FacilityType { get; init; } = "Warehouse";
    public string FacilityCode { get; init; } = string.Empty;
    public string FacilityName { get; init; } = string.Empty;
    public string PackageWeight { get; init; } = "2.5 kg";
    public string PackageDimensions { get; init; } = "30 x 20 x 15 cm";
    public string Status { get; init; } = "Pending";
    public DateTime OrderDate { get; init; }
    public DateTime? DispatchDate { get; init; }
    public decimal TotalAmount { get; init; }
    public int TotalItems { get; init; }
    public string Notes { get; init; } = string.Empty;
}
