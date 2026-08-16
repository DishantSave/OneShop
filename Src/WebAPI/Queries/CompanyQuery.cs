using Application.DTOs.Masters.Company;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class CompanyQuery
{
    [Authorize]
    [GraphQLDescription("Get Companies.")]
    public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync(
    [Service] ICompanyService companyService,
    ClaimsPrincipal user,
    CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
        ?? throw new GraphQLException("AccountId not found in token.");

        return await companyService.GetCompaniesAsync(accountId, cancellationToken);
    }
}