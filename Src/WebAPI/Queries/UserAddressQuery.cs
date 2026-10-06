using Application.DTOs.Address;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class UserAddressQuery
{
    [Authorize]
    [GraphQLName("userAddresses")]
    [GraphQLDescription("Get all saved delivery and billing addresses for the current logged-in user.")]
    public async Task<IEnumerable<UserAddressDto>> GetUserAddressesAsync(
        [Service] IUserAddressService addressService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var userName = user.FindFirst("user_name")?.Value
            ?? throw new GraphQLException("User Name not found in token.");

        return await addressService.GetUserAddressesAsync(accountId, userName, cancellationToken);
    }
}
