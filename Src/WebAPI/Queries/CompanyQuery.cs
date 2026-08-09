using Application.DTOs.Masters.Company;
using Application.Interfaces.GraphQLService;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class CompanyQuery
{
    [GraphQLDescription("Get Companies.")]
    public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync(
    [Service] ICompanyService companyService,
    string accountId,
    CancellationToken cancellationToken)
    {
        return await companyService.GetCompaniesAsync(accountId, cancellationToken);
    }
}