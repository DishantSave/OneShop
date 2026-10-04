namespace Application.DTOs.Masters.Warehouse;

public record WarehouseRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string Code,
    string Name,
    string DisplayName,
    string AddressLineOne,
    string? AddressLineTwo,
    string City,
    string StateCode,
    string CountryCode,
    string PostalCode,
    string Contact,
    string Email,
    bool IsTestWarehouse,
    bool IsActive
);
