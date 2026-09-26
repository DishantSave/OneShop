using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface ICompanyService
{
    Task<CompanyPayload> CreateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default);
    Task<CompanyPayload> UpdateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<CompanyDto>> GetCompaniesAsync(string accountId, CancellationToken cancellationToken = default);
    Task<CompanyDto?> GetCompanyByCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default);
    Task<bool> CheckCompanyCodeExistsAsync(string accountId, string companyCode, CancellationToken cancellationToken = default);
    Task<CompanyPayload> DeleteCompanyAsync(string accountId, string companyCode, string userName, CancellationToken cancellationToken = default);
}