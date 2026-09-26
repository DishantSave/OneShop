using Application.DTOs.Masters.Store;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class StoreMutation
{
    [Authorize]
    [GraphQLName("createStore")]
    [GraphQLDescription("Creates a new store/division under a specified company.")]
    public async Task<StorePayload> CreateStoreAsync(
        StoreInput input,
        ClaimsPrincipal user,
        [Service] IStoreService storeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new StoreRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.StoreCode.Trim().ToUpper(),
                input.StoreName.Trim(),
                input.StoreDisplayName.Trim(),
                input.StoreType.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.Website?.Trim(),
                input.Logo?.Trim(),
                input.CurrencyCode.Trim(),
                input.TimeZone.Trim(),
                input.IsTestStore,
                input.IsActive
            );

            return await storeService.CreateStoreAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new StorePayload
            {
                Success = false,
                Message = $"An error occurred while creating the store: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("updateStore")]
    [GraphQLDescription("Updates existing store/division details.")]
    public async Task<StorePayload> UpdateStoreAsync(
        StoreInput input,
        ClaimsPrincipal user,
        [Service] IStoreService storeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new StoreRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.StoreCode.Trim().ToUpper(),
                input.StoreName.Trim(),
                input.StoreDisplayName.Trim(),
                input.StoreType.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.Website?.Trim(),
                input.Logo?.Trim(),
                input.CurrencyCode.Trim(),
                input.TimeZone.Trim(),
                input.IsTestStore,
                input.IsActive
            );

            return await storeService.UpdateStoreAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new StorePayload
            {
                Success = false,
                Message = $"An error occurred while updating the store: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("deleteStore")]
    [GraphQLDescription("Deletes a store by company code and store code.")]
    public async Task<StorePayload> DeleteStoreAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] IStoreService storeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await storeService.DeleteStoreAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new StorePayload
            {
                Success = false,
                Message = $"An error occurred while deleting the store: {ex.Message}"
            };
        }
    }
}
