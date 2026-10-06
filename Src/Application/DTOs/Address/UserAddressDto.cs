namespace Application.DTOs.Address;

public record UserAddressDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
    public string AddressId { get; init; } = string.Empty;
    public string AddressType { get; init; } = "Office"; // Office, Home, Warehouse Dock, Branch, etc.
    public string ContactName { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string AddressLine1 { get; init; } = string.Empty;
    public string? AddressLine2 { get; init; }
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public string Country { get; init; } = "India";
    public bool IsDefault { get; init; }
    public DateTime DateCreated { get; init; }
}

public record UserAddressRequest(
    string AccountId,
    string UserName,
    string AddressId,
    string AddressType,
    string ContactName,
    string? Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault
);
