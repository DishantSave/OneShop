using Application.DTOs.Masters.Colour;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class ColourMutation
{
    [Authorize]
    [GraphQLName("createColour")]
    [GraphQLDescription("Creates a new colour.")]
    public async Task<ColourPayload> CreateColourAsync(
        ColourInput input,
        ClaimsPrincipal user,
        [Service] IColourService colourService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new ColourRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.HexCode?.Trim(),
                input.IsActive
            );

            return await colourService.CreateColourAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ColourPayload { Success = false, Message = $"An error occurred while creating the colour: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateColour")]
    [GraphQLDescription("Updates an existing colour.")]
    public async Task<ColourPayload> UpdateColourAsync(
        ColourInput input,
        ClaimsPrincipal user,
        [Service] IColourService colourService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new ColourRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.HexCode?.Trim(),
                input.IsActive
            );

            return await colourService.UpdateColourAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ColourPayload { Success = false, Message = $"An error occurred while updating the colour: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteColour")]
    [GraphQLDescription("Deletes an existing colour.")]
    public async Task<ColourPayload> DeleteColourAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] IColourService colourService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await colourService.DeleteColourAsync(accountId, companyCode, code, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new ColourPayload { Success = false, Message = $"An error occurred while deleting the colour: {ex.Message}" };
        }
    }
}
