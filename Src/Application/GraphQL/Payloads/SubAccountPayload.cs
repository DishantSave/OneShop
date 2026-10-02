using Application.DTOs.Users;

namespace Application.GraphQL.Payloads;

public class SubAccountPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public SubAccountDto? UserDetails { get; init; }
    public SubAccountDto? SubAccount => UserDetails;
}
