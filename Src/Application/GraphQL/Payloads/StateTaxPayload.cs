using Application.DTOs.Tax;

namespace Application.GraphQL.Payloads;

public class StateTaxPayload
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public StateTaxDto? TaxDetails { get; init; }
}
