namespace Application.DTOs.Discounts;

public record PromoCodeDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string DiscountType { get; init; } = "Percentage"; // Percentage or FixedAmount
    public decimal DiscountValue { get; init; }
    public decimal MinOrderAmount { get; init; }
    public decimal? MaxDiscountAmount { get; init; }
    public DateTime ValidFrom { get; init; }
    public DateTime ValidUntil { get; init; }
    public int UsageLimit { get; init; }
    public int TimesUsed { get; init; }
    public bool IsActive { get; init; } = true;
    public DateTime DateCreated { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}

public record PromoCodeRequest(
    string AccountId,
    string Code,
    string? Description,
    string DiscountType,
    decimal DiscountValue,
    decimal MinOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime? ValidFrom,
    DateTime? ValidUntil,
    int UsageLimit,
    bool IsActive,
    string UserName
);

public record PromoValidationResultDto
{
    public bool IsValid { get; init; }
    public string Message { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string? DiscountType { get; init; }
    public decimal DiscountValue { get; init; }
    public decimal CalculatedDiscount { get; init; }
}
