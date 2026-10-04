using Application.DTOs.Masters.Size;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class SizeMutation
{
    [Authorize]
    [GraphQLName("createSize")]
    [GraphQLDescription("Creates a new size.")]
    public async Task<SizePayload> CreateSizeAsync(
        SizeInput input,
        ClaimsPrincipal user,
        [Service] ISizeService sizeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new SizeRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.SortOrder,
                input.IsActive
            );

            return await sizeService.CreateSizeAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SizePayload { Success = false, Message = $"An error occurred while creating the size: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateSize")]
    [GraphQLDescription("Updates an existing size.")]
    public async Task<SizePayload> UpdateSizeAsync(
        SizeInput input,
        ClaimsPrincipal user,
        [Service] ISizeService sizeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new SizeRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.SortOrder,
                input.IsActive
            );

            return await sizeService.UpdateSizeAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SizePayload { Success = false, Message = $"An error occurred while updating the size: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteSize")]
    [GraphQLDescription("Deletes an existing size.")]
    public async Task<SizePayload> DeleteSizeAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] ISizeService sizeService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await sizeService.DeleteSizeAsync(accountId, companyCode, code, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new SizePayload { Success = false, Message = $"An error occurred while deleting the size: {ex.Message}" };
        }
    }
}
