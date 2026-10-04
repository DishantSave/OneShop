using Application.DTOs.Masters.Size;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class SizeService(ISizeRepository sizeRepository, ICompanyRepository companyRepository) : ISizeService
{
    private readonly ISizeRepository _sizeRepository = sizeRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<SizeDto>> GetSizesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        var sizeDetails = (await _sizeRepository.GetAllSizesAsync(accountId, companyCode, cancellationToken)).ToList();
        var sizeAuditDetails = await _sizeRepository.GetAllSizesAuditDetailsAsync(accountId, companyCode, cancellationToken);

        var auditLookup = sizeAuditDetails.ToLookup(sa => $"{sa.CompanyCode}:{sa.SizeCode}");

        foreach (var s in sizeDetails)
        {
            var key = $"{s.CompanyCode}:{s.Code}";
            s.Audit.AddRange(auditLookup[key]);
        }

        return sizeDetails;
    }

    public async Task<SizeDto?> GetSizeByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return null;

        return await _sizeRepository.GetSizeByCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<bool> CheckSizeCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return false;

        return await _sizeRepository.ExistsBySizeCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<SizePayload> CreateSizeAsync(SizeRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new SizePayload { Success = false, Message = "Company code is required." };

        if (string.IsNullOrWhiteSpace(code))
            return new SizePayload { Success = false, Message = "Size code is required." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new SizePayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _sizeRepository.ExistsBySizeCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new SizePayload { Success = false, Message = $"Size with code [{code}] already exists for Company [{companyCode}]." };

        return await _sizeRepository.RegisterSizeTransactionAsync(request, cancellationToken);
    }

    public async Task<SizePayload> UpdateSizeAsync(SizeRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (!await _sizeRepository.ExistsBySizeCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new SizePayload { Success = false, Message = $"Size [{code}] under Company [{companyCode}] could not be found." };

        return await _sizeRepository.UpdateSizeTransactionAsync(request, cancellationToken);
    }

    public async Task<SizePayload> DeleteSizeAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var sCode = code.Trim().ToUpper();

        if (!await _sizeRepository.ExistsBySizeCodeAsync(accountId, cCode, sCode, cancellationToken))
            return new SizePayload { Success = false, Message = $"Size [{sCode}] under Company [{cCode}] could not be found." };

        return await _sizeRepository.DeleteSizeTransactionAsync(accountId, cCode, sCode, userName, cancellationToken);
    }
}
