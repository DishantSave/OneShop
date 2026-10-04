using Application.DTOs.Catalog.Collection;

namespace Application.GraphQL.Payloads;

public class CollectionPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public CollectionDto? CollectionDetails { get; init; }
}
