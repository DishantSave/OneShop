using Application.DTOs.Inventory;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class InventoryQuery
{
    [Authorize]
    [GraphQLName("inventory")]
    [GraphQLDescription("Get inventory list for the current account, with optional filters by company, location type (Warehouse/Store), location code, and item number.")]
    public async Task<IEnumerable<InventoryDto>> GetInventoryAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("locationType")] string? locationType,
        [GraphQLName("locationCode")] string? locationCode,
        [GraphQLName("itemNumber")] string? itemNumber,
        [Service] IInventoryService inventoryService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await inventoryService.GetInventoryListAsync(accountId, companyCode, locationType, locationCode, itemNumber, cancellationToken);
    }

    [Authorize]
    [GraphQLName("inventoryRecord")]
    [GraphQLDescription("Get a specific inventory record with its audit trail.")]
    public async Task<InventoryDto?> GetInventoryRecordAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("itemNumber")] string itemNumber,
        [GraphQLName("colourCode")] string colourCode,
        [GraphQLName("sizeCode")] string sizeCode,
        [GraphQLName("locationType")] string locationType,
        [GraphQLName("locationCode")] string locationCode,
        [Service] IInventoryService inventoryService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await inventoryService.GetInventoryRecordAsync(accountId, companyCode, itemNumber, colourCode, sizeCode, locationType, locationCode, cancellationToken);
    }
}
