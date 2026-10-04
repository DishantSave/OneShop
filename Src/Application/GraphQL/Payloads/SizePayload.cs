using Application.DTOs.Masters.Size;

namespace Application.GraphQL.Payloads;

public class SizePayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public SizeDto? SizeDetails { get; init; }
}
