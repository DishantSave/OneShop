using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface ICompanyRepository
{
    Task<IEnumerable<CompanyDto>> GetAllCompaniesAsync(string accountId, CancellationToken cancellationToken = default);
    Task<CompanyDto?> GetCompanyByCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default);
    Task<IEnumerable<CompanyAuditTrailDto>> GetAllCompaniesAuditDetailsAsync(string accountId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByCompanyCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default);
    Task<CompanyPayload> RegisterCompanyTransactionAsync(string userAccountId, string userName, string companyCode, string companyName, string companyDisplayName, string addressLineOne, string? addressLineTwo, string city, string stateCode, string countryCode, string postalCode, string contact, string email, string? website, string? logo, string currencyCode, string timeZone, bool isTestCompany, bool isActive, CancellationToken cancellationToken = default);
    Task<CompanyPayload> UpdateCompanyTransactionAsync(string userAccountId, string userName, string companyCode, string companyName, string companyDisplayName, string addressLineOne, string? addressLineTwo, string city, string stateCode, string countryCode, string postalCode, string contact, string email, string? website, string? logo, string currencyCode, string timeZone, bool isTestCompany, bool isActive, CancellationToken cancellationToken = default);
    Task<CompanyPayload> DeleteCompanyTransactionAsync(string userAccountId, string companyCode, string userName, CancellationToken cancellationToken = default);
}