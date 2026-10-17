using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class ApiKeyMutation
{
    [Authorize]
    [GraphQLName("generateApiKey")]
    [GraphQLDescription("Generate a new API Key and bearer token for external system integration.")]
    public async Task<ApiKeyPayload> GenerateApiKeyAsync(
        [GraphQLName("name")] string name,
        [GraphQLName("permissions")] string? permissions,
        [GraphQLName("expiryDays")] int? expiryDays,
        [Service] IApiKeyService apiKeyService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        if (isCustomer)
        {
            return new ApiKeyPayload
            {
                Success = false,
                Message = "API Key generation is restricted to Vendor and Admin accounts."
            };
        }

        var userName = user.FindFirst(ClaimTypes.Name)?.Value
            ?? user.FindFirst("user_name")?.Value
            ?? user.FindFirst("username")?.Value
            ?? "Vendor";

        return await apiKeyService.GenerateApiKeyAsync(accountId, userName, name, permissions, expiryDays, cancellationToken);
    }

    [Authorize]
    [GraphQLName("revokeApiKey")]
    [GraphQLDescription("Revoke an existing API Key.")]
    public async Task<ApiKeyPayload> RevokeApiKeyAsync(
        [GraphQLName("keyId")] string keyId,
        [Service] IApiKeyService apiKeyService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        if (isCustomer)
        {
            return new ApiKeyPayload
            {
                Success = false,
                Message = "Unauthorized."
            };
        }

        return await apiKeyService.RevokeApiKeyAsync(accountId, keyId, cancellationToken);
    }

    [Authorize]
    [GraphQLName("deleteApiKey")]
    [GraphQLDescription("Permanently delete an API Key.")]
    public async Task<ApiKeyPayload> DeleteApiKeyAsync(
        [GraphQLName("keyId")] string keyId,
        [Service] IApiKeyService apiKeyService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        if (isCustomer)
        {
            return new ApiKeyPayload
            {
                Success = false,
                Message = "Unauthorized."
            };
        }

        return await apiKeyService.DeleteApiKeyAsync(accountId, keyId, cancellationToken);
    }
}
