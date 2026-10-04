using Application.DTOs.Masters.Warehouse;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class WarehouseService(IWarehouseRepository warehouseRepository, ICompanyRepository companyRepository) : IWarehouseService
{
    private readonly IWarehouseRepository _warehouseRepository = warehouseRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<WarehouseDto>> GetWarehousesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        var warehouseDetails = (await _warehouseRepository.GetAllWarehousesAsync(accountId, companyCode, cancellationToken)).ToList();
        var warehouseAuditDetails = await _warehouseRepository.GetAllWarehousesAuditDetailsAsync(accountId, companyCode, cancellationToken);

        var auditLookup = warehouseAuditDetails.ToLookup(wa => $"{wa.CompanyCode}:{wa.WarehouseCode}");

        foreach (var wh in warehouseDetails)
        {
            var key = $"{wh.CompanyCode}:{wh.Code}";
            wh.Audit.AddRange(auditLookup[key]);
        }

        return warehouseDetails;
    }

    public async Task<WarehouseDto?> GetWarehouseByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return null;

        return await _warehouseRepository.GetWarehouseByCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<bool> CheckWarehouseCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return false;

        return await _warehouseRepository.ExistsByWarehouseCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<WarehousePayload> CreateWarehouseAsync(WarehouseRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new WarehousePayload { Success = false, Message = "Company code is required." };

        if (code.Length < 2 || code.Length > 4)
            return new WarehousePayload { Success = false, Message = "Warehouse code must be between 2 and 4 characters." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new WarehousePayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _warehouseRepository.ExistsByWarehouseCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new WarehousePayload { Success = false, Message = $"Warehouse with code [{code}] already exists for Company [{companyCode}]." };

        return await _warehouseRepository.RegisterWarehouseTransactionAsync(request, cancellationToken);
    }

    public async Task<WarehousePayload> UpdateWarehouseAsync(WarehouseRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (!await _warehouseRepository.ExistsByWarehouseCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new WarehousePayload { Success = false, Message = $"Warehouse [{code}] under Company [{companyCode}] could not be found." };

        return await _warehouseRepository.UpdateWarehouseTransactionAsync(request, cancellationToken);
    }

    public async Task<WarehousePayload> DeleteWarehouseAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var wCode = code.Trim().ToUpper();

        if (!await _warehouseRepository.ExistsByWarehouseCodeAsync(accountId, cCode, wCode, cancellationToken))
            return new WarehousePayload { Success = false, Message = $"Warehouse [{wCode}] under Company [{cCode}] could not be found." };

        return await _warehouseRepository.DeleteWarehouseTransactionAsync(accountId, cCode, wCode, userName, cancellationToken);
    }
}
