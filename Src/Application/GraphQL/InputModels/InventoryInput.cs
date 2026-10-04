namespace Application.GraphQL.InputModels;

public class InventoryInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string SizeCode { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty; // 'Warehouse' (B2B) or 'Store' (B2C)
    public string LocationCode { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int AllocatedQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public string? Reason { get; set; }
}

public class BatchInventoryAdjustmentInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string ItemNumber { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string SizeCode { get; set; } = string.Empty;
    public int QuantityAdjustment { get; set; } // +10, -5, etc.
    public string? Reason { get; set; }
}
