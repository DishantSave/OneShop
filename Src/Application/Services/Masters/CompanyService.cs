using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class CompanyService(ICompanyRepository companyRepository) : ICompanyService
{
    readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync(string accountId, CancellationToken cancellationToken = default)
    {
        var companyDetails = await _companyRepository.GetAllCompaniesAsync(accountId, cancellationToken);

        var companyAuditDetails = await _companyRepository.GetAllCompaniesAuditDetailsAsync(accountId, cancellationToken);

        var auditLookup = companyAuditDetails.ToLookup(ca => ca.Code);

        foreach (var details in companyDetails)
        {
            details.Audit.AddRange(auditLookup[details.Code]);
        }

        return companyDetails;
    }

    public async Task<CompanyDto?> GetCompanyByCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode))
            return null;

        return await _companyRepository.GetCompanyByCodeAsync(accountId, companyCode.Trim().ToUpper(), cancellationToken);
    }

    public async Task<bool> CheckCompanyCodeExistsAsync(string accountId, string companyCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode))
            return false;

        return await _companyRepository.ExistsByCompanyCodeAsync(accountId, companyCode.Trim().ToUpper(), cancellationToken);
    }

    public async Task<CompanyPayload> CreateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.companyCode.Trim().ToUpper();

        if (code.Length != 2)
            return new CompanyPayload() { Success = false, Message = "Company code must be exactly 2 characters." };

        if (await _companyRepository.ExistsByCompanyCodeAsync(request.userAccountId, code, cancellationToken))
            return new CompanyPayload() { Success = false, Message = $"Company with code [{code}] already exists." };

        return await _companyRepository.RegisterCompanyTransactionAsync(
            request.userAccountId,
            request.userName,
            code,
            request.companyName.Trim(),
            request.companyDisplayName.Trim(),
            request.addressLineOne.Trim(),
            request.addressLineTwo?.Trim(),
            request.city.Trim(),
            request.stateCode.Trim(),
            request.countryCode.Trim().ToUpper(),
            request.postalCode.Trim(),
            request.contact.Trim(),
            request.email.Trim(),
            request.website?.Trim(),
            request.logo?.Trim(),
            request.currencyCode.Trim(),
            request.timeZone.Trim(),
            request.isTestCompany,
            request.isActive,
            cancellationToken
        );
    }

    public async Task<CompanyPayload> UpdateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.companyCode.Trim().ToUpper();

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.userAccountId, code, cancellationToken))
            return new CompanyPayload() { Success = false, Message = $"Company [{code}] could not be found." };

        return await _companyRepository.UpdateCompanyTransactionAsync(
            request.userAccountId,
            request.userName,
            code,
            request.companyName.Trim(),
            request.companyDisplayName.Trim(),
            request.addressLineOne.Trim(),
            request.addressLineTwo?.Trim(),
            request.city.Trim(),
            request.stateCode.Trim(),
            request.countryCode.Trim().ToUpper(),
            request.postalCode.Trim(),
            request.contact.Trim(),
            request.email.Trim(),
            request.website?.Trim(),
            request.logo?.Trim(),
            request.currencyCode.Trim(),
            request.timeZone.Trim(),
            request.isTestCompany,
            request.isActive,
            cancellationToken
        );
    }

    public async Task<CompanyPayload> DeleteCompanyAsync(string accountId, string companyCode, string userName, CancellationToken cancellationToken = default)
    {
        var code = companyCode.Trim().ToUpper();

        if (!await _companyRepository.ExistsByCompanyCodeAsync(accountId, code, cancellationToken))
            return new CompanyPayload() { Success = false, Message = $"Company [{code}] could not be found." };

        return await _companyRepository.DeleteCompanyTransactionAsync(accountId, code, userName, cancellationToken);
    }
}