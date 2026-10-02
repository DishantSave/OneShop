using Application.DTOs.Users;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class UserMutation
{
    [Authorize]
    [GraphQLName("createSubAccount")]
    [GraphQLDescription("Creates a new sub account under the current main account holder.")]
    public async Task<SubAccountPayload> CreateSubAccountAsync(
        SubAccountInput input,
        ClaimsPrincipal user,
        [Service] ISubAccountService subAccountService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var permissions = input.ScreenAccess?.Select(s => new SubAccountScreenAccessDto
            {
                ScreenName = s.ScreenName.Trim(),
                CanView = s.CanView,
                CanCreate = s.CanCreate,
                CanEdit = s.CanEdit,
                CanDelete = s.CanDelete
            }).ToList() ?? [];

            var request = new SubAccountRequest(
                accountId,
                userName,
                input.UserName.Trim(),
                input.Password?.Trim(),
                input.Designation?.Trim(),
                input.Department?.Trim(),
                input.Company?.Trim() ?? string.Empty,
                input.ProfilePicture?.Trim(),
                input.Email.Trim(),
                input.Contact.Trim(),
                input.Country.Trim().ToUpper(),
                input.IsTestAccount,
                input.IsActive,
                permissions
            );

            return await subAccountService.CreateSubAccountAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Failed to create sub account: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("updateSubAccount")]
    [GraphQLDescription("Updates an existing sub account.")]
    public async Task<SubAccountPayload> UpdateSubAccountAsync(
        SubAccountInput input,
        ClaimsPrincipal user,
        [Service] ISubAccountService subAccountService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var permissions = input.ScreenAccess?.Select(s => new SubAccountScreenAccessDto
            {
                ScreenName = s.ScreenName.Trim(),
                CanView = s.CanView,
                CanCreate = s.CanCreate,
                CanEdit = s.CanEdit,
                CanDelete = s.CanDelete
            }).ToList() ?? [];

            var request = new SubAccountRequest(
                accountId,
                userName,
                input.UserName.Trim(),
                input.Password?.Trim(),
                input.Designation?.Trim(),
                input.Department?.Trim(),
                input.Company?.Trim() ?? string.Empty,
                input.ProfilePicture?.Trim(),
                input.Email.Trim(),
                input.Contact.Trim(),
                input.Country.Trim().ToUpper(),
                input.IsTestAccount,
                input.IsActive,
                permissions
            );

            return await subAccountService.UpdateSubAccountAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Failed to update sub account: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("deleteSubAccount")]
    [GraphQLDescription("Deletes or deactivates a sub account.")]
    public async Task<SubAccountPayload> DeleteSubAccountAsync(
        [GraphQLName("userName")] string subAccountUserName,
        ClaimsPrincipal user,
        [Service] ISubAccountService subAccountService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await subAccountService.DeleteSubAccountAsync(accountId, userName, subAccountUserName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Failed to delete sub account: {ex.Message}"
            };
        }
    }
}
