using Application.DTOs.Address;

namespace Application.GraphQL.Payloads;

public class UserAddressPayload
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public UserAddressDto? AddressDetails { get; init; }
}
