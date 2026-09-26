using Application.DTOs.Masters.Store;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IStoreService
{
    Task<StorePayload> CreateStoreAsync(StoreRequest request, CancellationToken cancellationToken = default);
    Task<StorePayload> UpdateStoreAsync(StoreRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<StoreDto>> GetStoresAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<StoreDto?> GetStoreByCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default);
    Task<bool> CheckStoreCodeExistsAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default);
    Task<StorePayload> DeleteStoreAsync(string accountId, string companyCode, string storeCode, string userName, CancellationToken cancellationToken = default);
}
