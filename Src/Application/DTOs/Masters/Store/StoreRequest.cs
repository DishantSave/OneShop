namespace Application.DTOs.Masters.Store;

public record StoreRequest(
    string userAccountId,
    string userName,
    string companyCode,
    string storeCode,
    string storeName,
    string storeDisplayName,
    string storeType,
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
    bool isTestStore = false,
    bool isActive = true
);
