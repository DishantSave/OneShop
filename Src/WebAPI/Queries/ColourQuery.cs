using Application.DTOs.Masters.Colour;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class ColourQuery
{
    [Authorize]
    [GraphQLName("colours")]
    [GraphQLDescription("Get all colours for the current account, optionally filtered by company.")]
    public async Task<IEnumerable<ColourDto>> GetColoursAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [Service] IColourService colourService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await colourService.GetColoursAsync(accountId, companyCode, cancellationToken);
    }

    [Authorize]
    [GraphQLName("colour")]
    [GraphQLDescription("Get a single colour by company code and colour code with its audit trail.")]
    public async Task<ColourDto?> GetColourAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IColourService colourService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await colourService.GetColourByCodeAsync(accountId, companyCode, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkColourCodeExists")]
    [GraphQLDescription("Check if a colour code already exists within a specified company.")]
    public async Task<bool> CheckColourCodeExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IColourService colourService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await colourService.CheckColourCodeExistsAsync(accountId, companyCode, code, cancellationToken);
    }
}
