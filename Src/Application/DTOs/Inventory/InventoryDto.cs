namespace Application.DTOs.Inventory;

public class InventoryDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string ItemDisplayName { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string ColourName { get; set; } = string.Empty;
    public string? ColourHex { get; set; }
    public string SizeCode { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty; // 'Warehouse' (B2B) or 'Store' (B2C)
    public string LocationCode { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int AllocatedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public DateTime DateModified { get; set; }

    public List<InventoryAuditTrailDto> Audit { get; set; } = [];
}
