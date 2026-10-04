using Application.DTOs.Masters.Colour;

namespace Application.GraphQL.Payloads;

public class ColourPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public ColourDto? ColourDetails { get; init; }
}
