namespace Application.DTOs.Inventory;

public record InventoryRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string ItemNumber,
    string ColourCode,
    string SizeCode,
    string LocationType,
    string LocationCode,
    int QuantityOnHand,
    int AllocatedQuantity,
    int ReorderLevel,
    string? Reason
);
