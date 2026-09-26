using Application.DTOs.Masters.Store;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IStoreRepository
{
    Task<IEnumerable<StoreDto>> GetAllStoresAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<StoreDto?> GetStoreByCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<StoreAuditTrailDto>> GetAllStoresAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByStoreCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default);
    Task<StorePayload> RegisterStoreTransactionAsync(
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
        bool isTestStore,
        bool isActive,
        CancellationToken cancellationToken = default
    );
    Task<StorePayload> UpdateStoreTransactionAsync(
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
        bool isTestStore,
        bool isActive,
        CancellationToken cancellationToken = default
    );
    Task<StorePayload> DeleteStoreTransactionAsync(string userAccountId, string companyCode, string storeCode, string userName, CancellationToken cancellationToken = default);
}
