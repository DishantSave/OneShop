using Application.DTOs.ApiKey;

namespace Application.Interfaces.DataService;

public interface IApiKeyRepository
{
    Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync(string accountId, CancellationToken cancellationToken = default);
    Task<ApiKeyDto?> GetApiKeyByIdAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
    Task<bool> CreateApiKeyAsync(ApiKeyDto apiKey, CancellationToken cancellationToken = default);
    Task<bool> RevokeApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
    Task<bool> DeleteApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
    Task UpdateLastUsedAsync(string accountId, string keyId, CancellationToken cancellationToken = default);
}
