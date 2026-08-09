using Application.DTOs.Masters.Company;

namespace Application.GraphQL.Payloads;

public class CompanyPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public CompanyDto? CompanyDetails { get; init; }
}