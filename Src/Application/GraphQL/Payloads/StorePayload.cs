using Application.DTOs.Masters.Store;

namespace Application.GraphQL.Payloads;

public class StorePayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public StoreDto? StoreDetails { get; init; }
}
