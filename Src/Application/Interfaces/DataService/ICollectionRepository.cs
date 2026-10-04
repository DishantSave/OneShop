using Application.DTOs.Catalog.Collection;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface ICollectionRepository
{
    Task<IEnumerable<CollectionDto>> GetAllCollectionsAsync(string accountId, string? companyCode = null, string? channel = null, CancellationToken cancellationToken = default);
    Task<CollectionDto?> GetCollectionByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<CollectionItemDto>> GetCollectionItemsAsync(string accountId, string companyCode, string collectionCode, CancellationToken cancellationToken = default);
    Task<bool> ExistsByCollectionCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<CollectionPayload> RegisterCollectionTransactionAsync(CollectionRequest request, CancellationToken cancellationToken = default);
    Task<CollectionPayload> UpdateCollectionTransactionAsync(CollectionRequest request, CancellationToken cancellationToken = default);
    Task<CollectionPayload> DeleteCollectionTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
