using Application.DTOs.Catalog.Collection;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Catalog;

[ExtendObjectType("Mutation")]
public class CollectionMutation
{
    [Authorize]
    [GraphQLName("createCollection")]
    [GraphQLDescription("Creates a new collection.")]
    public async Task<CollectionPayload> CreateCollectionAsync(
        CollectionInput input,
        ClaimsPrincipal user,
        [Service] ICollectionService collectionService,
        [Service] IUserRoleResolver userRoleResolver,
        CancellationToken cancellationToken)
    {
        try
        {
            if (await userRoleResolver.IsCustomerAsync(user, cancellationToken))
            {
                return new CollectionPayload { Success = false, Message = "Customer accounts are not authorized to create collections." };
            }

            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var items = input.Items?.Select(x => new CollectionItemRequest(
                x.ItemNumber.Trim().ToUpper(),
                string.IsNullOrWhiteSpace(x.SizeCode) ? "ALL" : x.SizeCode.Trim().ToUpper(),
                x.SortOrder ?? 0
            )).ToList();

            var request = new CollectionRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.Description?.Trim(),
                input.Season?.Trim(),
                input.Channel?.Trim() ?? "Both",
                input.BannerImage?.Trim(),
                input.IsActive,
                items,
                input.ItemNumbers?.Select(x => x.Trim()).ToList()
            );

            return await collectionService.CreateCollectionAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CollectionPayload { Success = false, Message = $"An error occurred while creating the collection: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateCollection")]
    [GraphQLDescription("Updates an existing collection.")]
    public async Task<CollectionPayload> UpdateCollectionAsync(
        CollectionInput input,
        ClaimsPrincipal user,
        [Service] ICollectionService collectionService,
        [Service] IUserRoleResolver userRoleResolver,
        CancellationToken cancellationToken)
    {
        try
        {
            if (await userRoleResolver.IsCustomerAsync(user, cancellationToken))
            {
                return new CollectionPayload { Success = false, Message = "Customer accounts are not authorized to edit collections." };
            }

            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var items = input.Items?.Select(x => new CollectionItemRequest(
                x.ItemNumber.Trim().ToUpper(),
                string.IsNullOrWhiteSpace(x.SizeCode) ? "ALL" : x.SizeCode.Trim().ToUpper(),
                x.SortOrder ?? 0
            )).ToList();

            var request = new CollectionRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.Description?.Trim(),
                input.Season?.Trim(),
                input.Channel?.Trim() ?? "Both",
                input.BannerImage?.Trim(),
                input.IsActive,
                items,
                input.ItemNumbers?.Select(x => x.Trim()).ToList()
            );

            return await collectionService.UpdateCollectionAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CollectionPayload { Success = false, Message = $"An error occurred while updating the collection: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteCollection")]
    [GraphQLDescription("Deletes an existing collection.")]
    public async Task<CollectionPayload> DeleteCollectionAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] ICollectionService collectionService,
        [Service] IUserRoleResolver userRoleResolver,
        CancellationToken cancellationToken)
    {
        try
        {
            if (await userRoleResolver.IsCustomerAsync(user, cancellationToken))
            {
                return new CollectionPayload { Success = false, Message = "Customer accounts are not authorized to delete collections." };
            }

            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await collectionService.DeleteCollectionAsync(accountId, companyCode, code, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CollectionPayload { Success = false, Message = $"An error occurred while deleting the collection: {ex.Message}" };
        }
    }
}
