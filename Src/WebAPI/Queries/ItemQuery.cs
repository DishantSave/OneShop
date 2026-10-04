using Application.DTOs.Catalog.Item;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class ItemQuery
{
    [Authorize]
    [GraphQLName("items")]
    [GraphQLDescription("Get all items for the current account, optionally filtered by company and sales channel.")]
    public async Task<IEnumerable<ItemDto>> GetItemsAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("salesChannel")] string? salesChannel,
        [Service] IItemService itemService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await itemService.GetItemsAsync(accountId, companyCode, salesChannel, cancellationToken);
    }

    [Authorize]
    [GraphQLName("item")]
    [GraphQLDescription("Get a single item by company code and item number with its variants and audit trail.")]
    public async Task<ItemDto?> GetItemAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("itemNumber")] string itemNumber,
        [Service] IItemService itemService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await itemService.GetItemByNumberAsync(accountId, companyCode, itemNumber, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkItemNumberExists")]
    [GraphQLDescription("Check if an item number already exists within a specified company.")]
    public async Task<bool> CheckItemNumberExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("itemNumber")] string itemNumber,
        [Service] IItemService itemService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await itemService.CheckItemNumberExistsAsync(accountId, companyCode, itemNumber, cancellationToken);
    }
}
