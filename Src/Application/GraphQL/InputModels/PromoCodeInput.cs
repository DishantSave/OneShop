namespace Application.GraphQL.InputModels;

public class PromoCodeInput
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = "Percentage";
    public decimal DiscountValue { get; set; } = 0;
    public decimal MinOrderAmount { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public int UsageLimit { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
