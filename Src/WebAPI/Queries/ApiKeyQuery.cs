using Application.DTOs.ApiKey;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class ApiKeyQuery
{
    [Authorize]
    [GraphQLName("apiKeys")]
    [GraphQLDescription("Get all generated API keys for the current vendor account.")]
    public async Task<IEnumerable<ApiKeyDto>> GetApiKeysAsync(
        [Service] IApiKeyService apiKeyService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested)
            return [];

        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
            if (isCustomer)
            {
                throw new GraphQLException("API Keys and Developer Console are restricted to Vendor and Admin accounts.");
            }

            return await apiKeyService.GetApiKeysAsync(accountId, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            return [];
        }
    }
}
