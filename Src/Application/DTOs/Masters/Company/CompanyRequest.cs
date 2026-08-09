namespace Application.DTOs.Masters.Company;

public record CompanyRequest(
    string userAccountId,
    string userName,
    string companyCode,
    string companyName,
    string companyDisplayName,
    string addressLineOne,
    string? addressLineTwo,
    string city,
    string stateCode,
    string countryCode,
    string postalCode,
    string contact,
    string email,
    string? website,
    string? logo,
    string currencyCode,
    string timeZone,
    bool isTestCompany = false,
    bool isActive = true
);