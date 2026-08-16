namespace Application.GraphQL.InputModels;

public record CompanyInput(
    string CompanyCode,
    string CompanyName,
    string CompanyDisplayName,
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
    bool IsTestCompany = false,
    bool IsActive = true
);