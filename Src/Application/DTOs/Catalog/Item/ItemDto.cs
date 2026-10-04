namespace Application.DTOs.Catalog.Item;

public class ItemDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string SalesChannel { get; set; } = "Both"; // B2C, B2B, Both
    public decimal B2cPrice { get; set; }
    public decimal? B2cCompareAtPrice { get; set; }
    public decimal B2bPrice { get; set; }
    public int B2bMinQuantity { get; set; } = 1; // Minimum Order Quantity (MOQ)
    public string UnitOfMeasure { get; set; } = "PCS";
    public string? Season { get; set; }
    public string? Brand { get; set; }
    public string? Tags { get; set; }
    public string? Images { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }

    public List<ItemVariantDto> Variants { get; set; } = [];
    public List<ItemAuditTrailDto> Audit { get; set; } = [];
}
