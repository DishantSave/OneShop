using Application.DTOs.Catalog.Collection;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class CollectionQuery
{
    [Authorize]
    [GraphQLName("collections")]
    [GraphQLDescription("Get all collections for the current account, optionally filtered by company and channel.")]
    public async Task<IEnumerable<CollectionDto>> GetCollectionsAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("channel")] string? channel,
        [Service] ICollectionService collectionService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await collectionService.GetCollectionsAsync(accountId, companyCode, channel, cancellationToken);
    }

    [Authorize]
    [GraphQLName("collection")]
    [GraphQLDescription("Get a single collection by company code and collection code with its items.")]
    public async Task<CollectionDto?> GetCollectionAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] ICollectionService collectionService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await collectionService.GetCollectionByCodeAsync(accountId, companyCode, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkCollectionCodeExists")]
    [GraphQLDescription("Check if a collection code already exists within a specified company.")]
    public async Task<bool> CheckCollectionCodeExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] ICollectionService collectionService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await collectionService.CheckCollectionCodeExistsAsync(accountId, companyCode, code, cancellationToken);
    }
}
