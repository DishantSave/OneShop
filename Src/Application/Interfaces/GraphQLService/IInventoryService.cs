using Application.DTOs.Inventory;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IInventoryService
{
    Task<IEnumerable<InventoryDto>> GetInventoryListAsync(string accountId, string? companyCode = null, string? locationType = null, string? locationCode = null, string? itemNumber = null, CancellationToken cancellationToken = default);
    Task<InventoryDto?> GetInventoryRecordAsync(string accountId, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, CancellationToken cancellationToken = default);
    Task<InventoryPayload> UpsertInventoryAsync(InventoryRequest request, CancellationToken cancellationToken = default);
    Task<InventoryPayload> AdjustInventoryAsync(string accountId, string userName, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, int adjustment, string? reason, CancellationToken cancellationToken = default);
}
