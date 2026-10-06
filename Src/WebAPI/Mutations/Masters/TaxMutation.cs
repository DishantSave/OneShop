using Application.DTOs.Tax;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class TaxMutation
{
    [Authorize]
    [GraphQLName("saveStateTax")]
    [GraphQLDescription("Create or update a state tax configuration.")]
    public async Task<StateTaxPayload> SaveStateTaxAsync(
        StateTaxInput input,
        ClaimsPrincipal user,
        [Service] IStateTaxService taxService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new StateTaxRequest(
                accountId,
                string.IsNullOrWhiteSpace(input.CountryCode) ? "IN" : input.CountryCode.Trim().ToUpper(),
                input.StateCode.Trim().ToUpper(),
                input.StateName.Trim(),
                input.TaxRate,
                string.IsNullOrWhiteSpace(input.TaxType) ? "GST" : input.TaxType.Trim(),
                input.IsActive,
                userName
            );

            return await taxService.SaveStateTaxAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new StateTaxPayload { Success = false, Message = $"Error saving state tax: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteStateTax")]
    [GraphQLDescription("Delete a state tax configuration.")]
    public async Task<StateTaxPayload> DeleteStateTaxAsync(
        [GraphQLName("stateCode")] string stateCode,
        [GraphQLName("countryCode")] string? countryCode,
        ClaimsPrincipal user,
        [Service] IStateTaxService taxService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            return await taxService.DeleteStateTaxAsync(accountId, stateCode, countryCode ?? "IN", cancellationToken);
        }
        catch (Exception ex)
        {
            return new StateTaxPayload { Success = false, Message = $"Error deleting state tax: {ex.Message}" };
        }
    }
}
