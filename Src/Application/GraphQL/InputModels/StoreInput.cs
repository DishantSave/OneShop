namespace Application.GraphQL.InputModels;

public record StoreInput(
    string CompanyCode,
    string StoreCode,
    string StoreName,
    string StoreDisplayName,
    string StoreType,
    string AddressLineOne,
    string? AddressLineTwo,
    string City,
    string StateCode,
    string CountryCode,
    string PostalCode,
    string Contact,
    string Email,
    string? Website,
    string? Logo,
    string CurrencyCode,
    string TimeZone,
    bool IsTestStore = false,
    bool IsActive = true
);
