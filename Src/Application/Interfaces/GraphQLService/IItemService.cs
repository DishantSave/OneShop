using Application.DTOs.Catalog.Item;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IItemService
{
    Task<ItemPayload> CreateItemAsync(ItemRequest request, CancellationToken cancellationToken = default);
    Task<ItemPayload> UpdateItemAsync(ItemRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<ItemDto>> GetItemsAsync(string accountId, string? companyCode = null, string? salesChannel = null, CancellationToken cancellationToken = default);
    Task<ItemDto?> GetItemByNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default);
    Task<bool> CheckItemNumberExistsAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default);
    Task<ItemPayload> DeleteItemAsync(string accountId, string companyCode, string itemNumber, string userName, CancellationToken cancellationToken = default);
}
