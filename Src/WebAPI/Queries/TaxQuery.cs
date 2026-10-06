using Application.DTOs.Tax;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class TaxQuery
{
    [Authorize]
    [GraphQLName("stateTaxes")]
    [GraphQLDescription("Get all state tax configurations for the current account.")]
    public async Task<IEnumerable<StateTaxDto>> GetStateTaxesAsync(
        [GraphQLName("countryCode")] string? countryCode,
        [Service] IStateTaxService taxService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await taxService.GetStateTaxesAsync(accountId, countryCode ?? "IN", cancellationToken);
    }

    [Authorize]
    [GraphQLName("stateTaxByCode")]
    [GraphQLDescription("Get state tax configuration for a specific state code.")]
    public async Task<StateTaxDto?> GetStateTaxByCodeAsync(
        [GraphQLName("stateCode")] string stateCode,
        [GraphQLName("countryCode")] string? countryCode,
        [Service] IStateTaxService taxService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await taxService.GetStateTaxByCodeAsync(accountId, stateCode, countryCode ?? "IN", cancellationToken);
    }
}
