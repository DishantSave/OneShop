namespace Application.DTOs.Catalog.Collection;

public class CollectionItemDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CollectionCode { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string SizeCode { get; set; } = "ALL";
    public string? SizeName { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemDisplayName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string SalesChannel { get; set; } = string.Empty;
    public decimal B2cPrice { get; set; }
    public decimal B2bPrice { get; set; }
    public int B2bMinQuantity { get; set; }
    public int SortOrder { get; set; }
    public DateTime DateAdded { get; set; }
}
