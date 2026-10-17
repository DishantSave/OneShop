using Application.DTOs.ApiKey;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IApiKeyService
{
    Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync(string accountId, CancellationToken cancellationToken = default);
    Task<ApiKeyPayload> GenerateApiKeyAsync(string accountId, string userName, string name, string? permissions = null, int? expiryDays = null, CancellationToken cancellationToken = default);
    Task<ApiKeyPayload> RevokeApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
    Task<ApiKeyPayload> DeleteApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
}
