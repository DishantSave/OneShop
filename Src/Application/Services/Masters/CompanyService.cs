using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class CompanyService(ICompanyRepository companyRepository) : ICompanyService
{
    readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<CompanyPayload> CreateCompanyAsync(CompanyRequest request, CancellationToken cancellationToken = default)
    {
        if (await _companyRepository.ExistsByCompanyCodeAsync(request.userAccountId, request.companyCode, cancellationToken))
            return new CompanyPayload() { Success = false, Message = $"Company {request.companyName} is already created." };

        return await _companyRepository.RegisterCompanyTransactionAsync(
            request.userAccountId,
            request.userName,
            request.companyCode,
            request.companyName,
            request.companyDisplayName,
            request.addressLineOne,
            request.addressLineTwo,
            request.city,
            request.stateCode,
            request.countryCode,
            request.postalCode,
            request.contact,
            request.email,
            request.website,
            request.logo,
            request.currencyCode,
            request.timeZone,
            request.isTestCompany,
            request.isActive,
            cancellationToken
        );
    }

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
}