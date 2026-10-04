namespace Application.DTOs.Catalog.Item;

public class ItemVariantDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string ColourName { get; set; } = string.Empty;
    public string? ColourHex { get; set; }
    public string SizeCode { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public string? Sku { get; set; }
    public string? Barcode { get; set; }
    public decimal AdditionalPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }
}
