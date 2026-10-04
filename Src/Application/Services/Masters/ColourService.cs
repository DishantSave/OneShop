using Application.DTOs.Masters.Colour;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class ColourService(IColourRepository colourRepository, ICompanyRepository companyRepository) : IColourService
{
    private readonly IColourRepository _colourRepository = colourRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<ColourDto>> GetColoursAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        var colourDetails = (await _colourRepository.GetAllColoursAsync(accountId, companyCode, cancellationToken)).ToList();
        var colourAuditDetails = await _colourRepository.GetAllColoursAuditDetailsAsync(accountId, companyCode, cancellationToken);

        var auditLookup = colourAuditDetails.ToLookup(ca => $"{ca.CompanyCode}:{ca.ColourCode}");

        foreach (var c in colourDetails)
        {
            var key = $"{c.CompanyCode}:{c.Code}";
            c.Audit.AddRange(auditLookup[key]);
        }

        return colourDetails;
    }

    public async Task<ColourDto?> GetColourByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return null;

        return await _colourRepository.GetColourByCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<bool> CheckColourCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return false;

        return await _colourRepository.ExistsByColourCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<ColourPayload> CreateColourAsync(ColourRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new ColourPayload { Success = false, Message = "Company code is required." };

        if (string.IsNullOrWhiteSpace(code))
            return new ColourPayload { Success = false, Message = "Colour code is required." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new ColourPayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _colourRepository.ExistsByColourCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new ColourPayload { Success = false, Message = $"Colour with code [{code}] already exists for Company [{companyCode}]." };

        return await _colourRepository.RegisterColourTransactionAsync(request, cancellationToken);
    }

    public async Task<ColourPayload> UpdateColourAsync(ColourRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (!await _colourRepository.ExistsByColourCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new ColourPayload { Success = false, Message = $"Colour [{code}] under Company [{companyCode}] could not be found." };

        return await _colourRepository.UpdateColourTransactionAsync(request, cancellationToken);
    }

    public async Task<ColourPayload> DeleteColourAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var clrCode = code.Trim().ToUpper();

        if (!await _colourRepository.ExistsByColourCodeAsync(accountId, cCode, clrCode, cancellationToken))
            return new ColourPayload { Success = false, Message = $"Colour [{clrCode}] under Company [{cCode}] could not be found." };

        return await _colourRepository.DeleteColourTransactionAsync(accountId, cCode, clrCode, userName, cancellationToken);
    }
}
