using Application.DTOs.Inventory;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Inventory;

public class InventoryService(IInventoryRepository inventoryRepository, ICompanyRepository companyRepository) : IInventoryService
{
    private readonly IInventoryRepository _inventoryRepository = inventoryRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<InventoryDto>> GetInventoryListAsync(string accountId, string? companyCode = null, string? locationType = null, string? locationCode = null, string? itemNumber = null, CancellationToken cancellationToken = default)
    {
        return await _inventoryRepository.GetInventoryListAsync(accountId, companyCode, locationType, locationCode, itemNumber, cancellationToken);
    }

    public async Task<InventoryDto?> GetInventoryRecordAsync(string accountId, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(itemNumber))
            return null;

        var record = await _inventoryRepository.GetInventoryRecordAsync(accountId, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), colourCode.Trim().ToUpper(), sizeCode.Trim().ToUpper(), locationType.Trim(), locationCode.Trim().ToUpper(), cancellationToken);
        if (record != null)
        {
            var audit = await _inventoryRepository.GetInventoryAuditDetailsAsync(accountId, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), colourCode.Trim().ToUpper(), sizeCode.Trim().ToUpper(), locationType.Trim(), locationCode.Trim().ToUpper(), cancellationToken);
            record.Audit = audit.ToList();
        }

        return record;
    }

    public async Task<InventoryPayload> UpsertInventoryAsync(InventoryRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new InventoryPayload { Success = false, Message = $"Company [{companyCode}] does not exist." };

        if (request.QuantityOnHand < 0)
            return new InventoryPayload { Success = false, Message = "Quantity on hand cannot be negative." };

        return await _inventoryRepository.UpsertInventoryTransactionAsync(request, cancellationToken);
    }

    public async Task<InventoryPayload> AdjustInventoryAsync(string accountId, string userName, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, int adjustment, string? reason, CancellationToken cancellationToken = default)
    {
        return await _inventoryRepository.AdjustInventoryTransactionAsync(accountId, userName, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), colourCode.Trim().ToUpper(), sizeCode.Trim().ToUpper(), locationType.Trim(), locationCode.Trim().ToUpper(), adjustment, reason, cancellationToken);
    }
}
