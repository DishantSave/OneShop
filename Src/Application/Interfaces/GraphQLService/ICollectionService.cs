using Application.DTOs.Catalog.Collection;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface ICollectionService
{
    Task<CollectionPayload> CreateCollectionAsync(CollectionRequest request, CancellationToken cancellationToken = default);
    Task<CollectionPayload> UpdateCollectionAsync(CollectionRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<CollectionDto>> GetCollectionsAsync(string accountId, string? companyCode = null, string? channel = null, CancellationToken cancellationToken = default);
    Task<CollectionDto?> GetCollectionByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<bool> CheckCollectionCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<CollectionPayload> DeleteCollectionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
