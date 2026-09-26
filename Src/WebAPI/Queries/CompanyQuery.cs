using Application.DTOs.Masters.Company;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class CompanyQuery
{
    [Authorize]
    [GraphQLName("companies")]
    [GraphQLDescription("Get all companies for the current account.")]
    public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync(
        [Service] ICompanyService companyService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await companyService.GetCompaniesAsync(accountId, cancellationToken);
    }

    [Authorize]
    [GraphQLName("company")]
    [GraphQLDescription("Get a single company by code with its audit trail.")]
    public async Task<CompanyDto?> GetCompanyAsync(
        [GraphQLName("code")] string code,
        [Service] ICompanyService companyService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await companyService.GetCompanyByCodeAsync(accountId, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkCompanyCodeExists")]
    [GraphQLDescription("Check if a company code already exists for the current account.")]
    public async Task<bool> CheckCompanyCodeExistsAsync(
        [GraphQLName("code")] string code,
        [Service] ICompanyService companyService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await companyService.CheckCompanyCodeExistsAsync(accountId, code, cancellationToken);
    }
}