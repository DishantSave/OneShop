using Application.DTOs.Masters.Store;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class StoreQuery
{
    [Authorize]
    [GraphQLName("stores")]
    [GraphQLDescription("Get all stores/divisions for the current account, optionally filtered by company.")]
    public async Task<IEnumerable<StoreDto>> GetStoresAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [Service] IStoreService storeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await storeService.GetStoresAsync(accountId, companyCode, cancellationToken);
    }

    [Authorize]
    [GraphQLName("store")]
    [GraphQLDescription("Get a single store by company code and store code with its audit trail.")]
    public async Task<StoreDto?> GetStoreAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IStoreService storeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await storeService.GetStoreByCodeAsync(accountId, companyCode, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkStoreCodeExists")]
    [GraphQLDescription("Check if a store code already exists within a specified company.")]
    public async Task<bool> CheckStoreCodeExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IStoreService storeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await storeService.CheckStoreCodeExistsAsync(accountId, companyCode, code, cancellationToken);
    }
}
