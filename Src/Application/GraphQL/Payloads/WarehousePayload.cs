using Application.DTOs.Masters.Warehouse;

namespace Application.GraphQL.Payloads;

public class WarehousePayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public WarehouseDto? WarehouseDetails { get; init; }
}
