using Application.DTOs.Inventory;

namespace Application.GraphQL.Payloads;

public class InventoryPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public InventoryDto? InventoryDetails { get; init; }
}
