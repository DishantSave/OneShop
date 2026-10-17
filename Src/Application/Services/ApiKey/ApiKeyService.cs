using Application.DTOs.ApiKey;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using System.Security.Cryptography;

namespace Application.Services.ApiKey;

public class ApiKeyService(
    IApiKeyRepository apiKeyRepository,
    IJwtTokenService jwtTokenService) : IApiKeyService
{
    private readonly IApiKeyRepository _apiKeyRepository = apiKeyRepository;
    private readonly IJwtTokenService _jwtTokenService = jwtTokenService;

    public async Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync(string accountId, CancellationToken cancellationToken = default)
    {
        return await _apiKeyRepository.GetApiKeysAsync(accountId, cancellationToken);
    }

    public async Task<ApiKeyPayload> GenerateApiKeyAsync(
        string accountId,
        string userName,
        string name,
        string? permissions = null,
        int? expiryDays = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return new ApiKeyPayload
            {
                Success = false,
                Message = "Key name is required."
            };
        }

        var keyId = $"key_live_{Guid.NewGuid():N}";
        var randomSecret = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        var rawApiKey = $"oneshop_live_{randomSecret}";
        var maskedApiKey = $"oneshop_live_...{rawApiKey[^6..]}";
        var effectiveExpiry = expiryDays.HasValue && expiryDays.Value > 0 ? expiryDays.Value : 365;

        // Generate high-trust JWT for external system execution
        var apiToken = _jwtTokenService.GenerateToken(
            accountId: accountId,
            userId: keyId,
            userName: userName,
            isCustomerAccount: false,
            isSellerAccount: true,
            customExpiryDays: effectiveExpiry);

        var expiresAt = DateTime.UtcNow.AddDays(effectiveExpiry);
        var effectivePerms = string.IsNullOrWhiteSpace(permissions)
            ? "read:orders,read:items,read:companies,read:stores,read:warehouses,read:labels"
            : permissions.Trim();

        var keyDto = new ApiKeyDto
        {
            KeyId = keyId,
            AccountId = accountId,
            Name = name.Trim(),
            ApiKeyMasked = maskedApiKey,
            ApiToken = apiToken,
            Permissions = effectivePerms,
            Status = "Active",
            DateCreated = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            LastUsed = null,
            CreatedBy = userName
        };

        var created = await _apiKeyRepository.CreateApiKeyAsync(keyDto, cancellationToken);
        if (!created)
        {
            return new ApiKeyPayload
            {
                Success = false,
                Message = "Failed to create API key in database."
            };
        }

        return new ApiKeyPayload
        {
            Success = true,
            Message = "API Key generated successfully. Please copy your key and token securely.",
            ApiKey = rawApiKey,
            ApiToken = apiToken,
            KeyDetails = keyDto
        };
    }

    public async Task<ApiKeyPayload> RevokeApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        var success = await _apiKeyRepository.RevokeApiKeyAsync(accountId, keyId, cancellationToken);
        return new ApiKeyPayload
        {
            Success = success,
            Message = success ? "API key revoked successfully." : "API key could not be revoked."
        };
    }

    public async Task<ApiKeyPayload> DeleteApiKeyAsync(string accountId, string keyId, CancellationToken cancellationToken = default)
    {
        var success = await _apiKeyRepository.DeleteApiKeyAsync(accountId, keyId, cancellationToken);
        return new ApiKeyPayload
        {
            Success = success,
            Message = success ? "API key deleted successfully." : "API key could not be deleted."
        };
    }
}
