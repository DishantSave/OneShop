using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface ICompanyService
{
    Task<CompanyPayload> CreateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<CompanyDto>> GetCompaniesAsync(string accountId, CancellationToken cancellationToken = default);
}