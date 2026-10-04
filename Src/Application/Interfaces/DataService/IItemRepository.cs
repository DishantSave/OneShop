using Application.DTOs.Catalog.Item;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IItemRepository
{
    Task<IEnumerable<ItemDto>> GetAllItemsAsync(string accountId, string? companyCode = null, string? salesChannel = null, CancellationToken cancellationToken = default);
    Task<ItemDto?> GetItemByNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<ItemVariantDto>> GetItemVariantsAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<ItemAuditTrailDto>> GetAllItemsAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByItemNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default);
    Task<ItemPayload> RegisterItemTransactionAsync(ItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemPayload> UpdateItemTransactionAsync(ItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemPayload> DeleteItemTransactionAsync(string accountId, string companyCode, string itemNumber, string userName, CancellationToken cancellationToken = default);
}
