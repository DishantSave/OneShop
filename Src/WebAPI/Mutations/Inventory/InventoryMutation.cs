using Application.DTOs.Inventory;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Inventory;

[ExtendObjectType("Mutation")]
public class InventoryMutation
{
    [Authorize]
    [GraphQLName("upsertInventory")]
    [GraphQLDescription("Creates or updates an inventory stock level.")]
    public async Task<InventoryPayload> UpsertInventoryAsync(
        InventoryInput input,
        ClaimsPrincipal user,
        [Service] IInventoryService inventoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new InventoryRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.ItemNumber.Trim().ToUpper(),
                input.ColourCode.Trim().ToUpper(),
                input.SizeCode.Trim().ToUpper(),
                input.LocationType.Trim(),
                input.LocationCode.Trim().ToUpper(),
                input.QuantityOnHand,
                input.AllocatedQuantity,
                input.ReorderLevel,
                input.Reason?.Trim()
            );

            return await inventoryService.UpsertInventoryAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new InventoryPayload { Success = false, Message = $"An error occurred while updating inventory: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("adjustInventory")]
    [GraphQLDescription("Adjusts inventory stock quantity by a positive or negative amount.")]
    public async Task<InventoryPayload> AdjustInventoryAsync(
        BatchInventoryAdjustmentInput input,
        ClaimsPrincipal user,
        [Service] IInventoryService inventoryService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await inventoryService.AdjustInventoryAsync(
                accountId,
                userName,
                input.CompanyCode,
                input.ItemNumber,
                input.ColourCode,
                input.SizeCode,
                input.LocationType,
                input.LocationCode,
                input.QuantityAdjustment,
                input.Reason,
                cancellationToken
            );
        }
        catch (Exception ex)
        {
            return new InventoryPayload { Success = false, Message = $"An error occurred while adjusting inventory: {ex.Message}" };
        }
    }
}
