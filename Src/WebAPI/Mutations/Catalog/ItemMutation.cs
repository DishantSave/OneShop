using Application.DTOs.Catalog.Item;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Catalog;

[ExtendObjectType("Mutation")]
public class ItemMutation
{
    [Authorize]
    [GraphQLName("createItem")]
    [GraphQLDescription("Creates a new item with variants.")]
    public async Task<ItemPayload> CreateItemAsync(
        ItemInput input,
        ClaimsPrincipal user,
        [Service] IItemService itemService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var variants = input.Variants?.Select(v => new ItemVariantRequest(
                v.ColourCode.Trim().ToUpper(),
                v.SizeCode.Trim().ToUpper(),
                v.Sku?.Trim(),
                v.Barcode?.Trim(),
                v.AdditionalPrice,
                v.IsActive
            )).ToList();

            var request = new ItemRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.ItemNumber.Trim().ToUpper(),
                input.Name.Trim(),
                string.IsNullOrWhiteSpace(input.DisplayName) ? input.Name.Trim() : input.DisplayName.Trim(),
                input.Description?.Trim(),
                input.Category.Trim(),
                input.SalesChannel?.Trim() ?? "Both",
                input.B2cPrice,
                input.B2cCompareAtPrice,
                input.B2bPrice,
                input.B2bMinQuantity < 1 ? 1 : input.B2bMinQuantity,
                string.IsNullOrWhiteSpace(input.UnitOfMeasure) ? "PCS" : input.UnitOfMeasure.Trim(),
                input.Season?.Trim(),
                input.Brand?.Trim(),
                input.Tags?.Trim(),
                input.Images?.Trim(),
                input.IsActive,
                variants
            );

            return await itemService.CreateItemAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ItemPayload { Success = false, Message = $"An error occurred while creating the item: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateItem")]
    [GraphQLDescription("Updates an existing item and its variants.")]
    public async Task<ItemPayload> UpdateItemAsync(
        ItemInput input,
        ClaimsPrincipal user,
        [Service] IItemService itemService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var variants = input.Variants?.Select(v => new ItemVariantRequest(
                v.ColourCode.Trim().ToUpper(),
                v.SizeCode.Trim().ToUpper(),
                v.Sku?.Trim(),
                v.Barcode?.Trim(),
                v.AdditionalPrice,
                v.IsActive
            )).ToList();

            var request = new ItemRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.ItemNumber.Trim().ToUpper(),
                input.Name.Trim(),
                string.IsNullOrWhiteSpace(input.DisplayName) ? input.Name.Trim() : input.DisplayName.Trim(),
                input.Description?.Trim(),
                input.Category.Trim(),
                input.SalesChannel?.Trim() ?? "Both",
                input.B2cPrice,
                input.B2cCompareAtPrice,
                input.B2bPrice,
                input.B2bMinQuantity < 1 ? 1 : input.B2bMinQuantity,
                string.IsNullOrWhiteSpace(input.UnitOfMeasure) ? "PCS" : input.UnitOfMeasure.Trim(),
                input.Season?.Trim(),
                input.Brand?.Trim(),
                input.Tags?.Trim(),
                input.Images?.Trim(),
                input.IsActive,
                variants
            );

            return await itemService.UpdateItemAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ItemPayload { Success = false, Message = $"An error occurred while updating the item: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteItem")]
    [GraphQLDescription("Deletes an existing item.")]
    public async Task<ItemPayload> DeleteItemAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("itemNumber")] string itemNumber,
        ClaimsPrincipal user,
        [Service] IItemService itemService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await itemService.DeleteItemAsync(accountId, companyCode, itemNumber, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ItemPayload { Success = false, Message = $"An error occurred while deleting the item: {ex.Message}" };
        }
    }
}
