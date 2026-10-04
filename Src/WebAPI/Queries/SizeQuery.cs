using Application.DTOs.Masters.Size;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class SizeQuery
{
    [Authorize]
    [GraphQLName("sizes")]
    [GraphQLDescription("Get all sizes for the current account, optionally filtered by company.")]
    public async Task<IEnumerable<SizeDto>> GetSizesAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [Service] ISizeService sizeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await sizeService.GetSizesAsync(accountId, companyCode, cancellationToken);
    }

    [Authorize]
    [GraphQLName("size")]
    [GraphQLDescription("Get a single size by company code and size code with its audit trail.")]
    public async Task<SizeDto?> GetSizeAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] ISizeService sizeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await sizeService.GetSizeByCodeAsync(accountId, companyCode, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkSizeCodeExists")]
    [GraphQLDescription("Check if a size code already exists within a specified company.")]
    public async Task<bool> CheckSizeCodeExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] ISizeService sizeService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await sizeService.CheckSizeCodeExistsAsync(accountId, companyCode, code, cancellationToken);
    }
}
