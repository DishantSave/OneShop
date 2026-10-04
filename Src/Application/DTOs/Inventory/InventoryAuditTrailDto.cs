namespace Application.DTOs.Inventory;

public class InventoryAuditTrailDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string SizeCode { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DateModified { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
}
