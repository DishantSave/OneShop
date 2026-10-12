namespace Application.DTOs.DeliveryPartner;

public record DeliveryPartnerDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string CompanyCode { get; init; } = string.Empty;
    public string PartnerName { get; init; } = string.Empty;
    public string Channel { get; init; } = "B2C";
    public string ItemCategory { get; init; } = "ALL";
    public decimal BaseShippingRate { get; init; } = 5.00m;
    public decimal PerItemShippingRate { get; init; } = 1.00m;
    public decimal FreeShippingThreshold { get; init; } = 500.00m;
    public int EstimatedDays { get; init; } = 3;
    public bool IsDefault { get; init; } = true;
    public bool IsActive { get; init; } = true;
    public DateTime DateCreated { get; init; }
    public DateTime DateModified { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}

public record DeliveryPartnerRequest(
    string CompanyCode,
    string PartnerName,
    string Channel,
    string? ItemCategory,
    decimal BaseShippingRate,
    decimal PerItemShippingRate,
    decimal FreeShippingThreshold,
    int EstimatedDays,
    bool IsDefault,
    bool IsActive
);

public class DeliveryPartnerPayload
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DeliveryPartnerDto? Data { get; set; }
}

public class ShippingCalculationResult
{
    public string AssignedPartnerName { get; set; } = string.Empty;
    public decimal TotalShippingCost { get; set; }
    public decimal PerItemShippingCost { get; set; }
    public bool IsFreeShipping { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public int EstimatedDays { get; set; }
}
