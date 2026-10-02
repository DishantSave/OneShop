using Application.DTOs.Users;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class UserQuery
{
    [Authorize]
    [GraphQLName("subAccounts")]
    [GraphQLDescription("Get all sub accounts for the current main account holder.")]
    public async Task<IEnumerable<SubAccountDto>> GetSubAccountsAsync(
        [Service] ISubAccountService subAccountService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var userName = user.FindFirst("user_name")?.Value
            ?? throw new GraphQLException("User Name not found in token.");

        return await subAccountService.GetSubAccountsAsync(accountId, userName, cancellationToken);
    }

    [Authorize]
    [GraphQLName("subAccount")]
    [GraphQLDescription("Get a single sub account by username with its audit trail and screen access.")]
    public async Task<SubAccountDto?> GetSubAccountAsync(
        [GraphQLName("userName")] string subAccountUserName,
        [Service] ISubAccountService subAccountService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var userName = user.FindFirst("user_name")?.Value
            ?? throw new GraphQLException("User Name not found in token.");

        return await subAccountService.GetSubAccountByUserNameAsync(accountId, userName, subAccountUserName, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkSubAccountUserNameExists")]
    [GraphQLDescription("Check if a username already exists.")]
    public async Task<bool> CheckSubAccountUserNameExistsAsync(
        [GraphQLName("userName")] string subAccountUserName,
        [Service] ISubAccountService subAccountService,
        CancellationToken cancellationToken)
    {
        return await subAccountService.CheckUserNameExistsAsync(subAccountUserName, cancellationToken);
    }
}
