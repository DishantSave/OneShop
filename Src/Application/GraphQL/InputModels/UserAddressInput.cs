namespace Application.GraphQL.InputModels;

public class UserAddressInput
{
    public string? AddressId { get; set; }
    public string AddressType { get; set; } = "Office";
    public string ContactName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public bool IsDefault { get; set; } = false;
}
