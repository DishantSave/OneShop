using Application.DTOs.Address;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class UserAddressMutation
{
    [Authorize]
    [GraphQLName("saveUserAddress")]
    [GraphQLDescription("Create or update a saved delivery/billing address for the current user.")]
    public async Task<UserAddressPayload> SaveUserAddressAsync(
        UserAddressInput input,
        ClaimsPrincipal user,
        [Service] IUserAddressService addressService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new UserAddressRequest(
                accountId,
                userName,
                input.AddressId?.Trim() ?? string.Empty,
                string.IsNullOrWhiteSpace(input.AddressType) ? "Office" : input.AddressType.Trim(),
                input.ContactName.Trim(),
                input.Phone?.Trim(),
                input.AddressLine1.Trim(),
                input.AddressLine2?.Trim(),
                input.City.Trim(),
                input.State.Trim(),
                input.PostalCode.Trim(),
                string.IsNullOrWhiteSpace(input.Country) ? "India" : input.Country.Trim(),
                input.IsDefault
            );

            return await addressService.SaveUserAddressAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new UserAddressPayload { Success = false, Message = $"Error saving address: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteUserAddress")]
    [GraphQLDescription("Delete a saved address for the current user.")]
    public async Task<UserAddressPayload> DeleteUserAddressAsync(
        [GraphQLName("addressId")] string addressId,
        ClaimsPrincipal user,
        [Service] IUserAddressService addressService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await addressService.DeleteUserAddressAsync(accountId, userName, addressId, cancellationToken);
        }
        catch (Exception ex)
        {
            return new UserAddressPayload { Success = false, Message = $"Error deleting address: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("setDefaultAddress")]
    [GraphQLDescription("Mark a saved address as the default address for the current user.")]
    public async Task<UserAddressPayload> SetDefaultAddressAsync(
        [GraphQLName("addressId")] string addressId,
        ClaimsPrincipal user,
        [Service] IUserAddressService addressService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await addressService.SetDefaultAddressAsync(accountId, userName, addressId, cancellationToken);
        }
        catch (Exception ex)
        {
            return new UserAddressPayload { Success = false, Message = $"Error updating default address: {ex.Message}" };
        }
    }
}
