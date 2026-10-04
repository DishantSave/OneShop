using Application.DTOs.Catalog.Item;

namespace Application.GraphQL.Payloads;

public class ItemPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public ItemDto? ItemDetails { get; init; }
}
