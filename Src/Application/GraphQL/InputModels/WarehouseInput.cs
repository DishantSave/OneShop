namespace Application.GraphQL.InputModels;

public class WarehouseInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string AddressLineOne { get; set; } = string.Empty;
    public string? AddressLineTwo { get; set; }
    public string City { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsTestWarehouse { get; set; }
    public bool IsActive { get; set; } = true;
}
