using Application.DTOs.Catalog.Item;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Catalog;

public class ItemService(IItemRepository itemRepository, ICompanyRepository companyRepository) : IItemService
{
    private readonly IItemRepository _itemRepository = itemRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<ItemDto>> GetItemsAsync(string accountId, string? companyCode = null, string? salesChannel = null, CancellationToken cancellationToken = default)
    {
        var items = (await _itemRepository.GetAllItemsAsync(accountId, companyCode, salesChannel, cancellationToken)).ToList();
        var audits = await _itemRepository.GetAllItemsAuditDetailsAsync(accountId, companyCode, cancellationToken);
        var auditLookup = audits.ToLookup(a => $"{a.CompanyCode}:{a.ItemNumber}");

        foreach (var item in items)
        {
            var key = $"{item.CompanyCode}:{item.ItemNumber}";
            item.Audit.AddRange(auditLookup[key]);
            var variants = await _itemRepository.GetItemVariantsAsync(accountId, item.CompanyCode, item.ItemNumber, cancellationToken);
            item.Variants = variants.ToList();
        }

        return items;
    }

    public async Task<ItemDto?> GetItemByNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(itemNumber))
            return null;

        var item = await _itemRepository.GetItemByNumberAsync(accountId, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), cancellationToken);
        if (item != null)
        {
            var variants = await _itemRepository.GetItemVariantsAsync(accountId, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), cancellationToken);
            item.Variants = variants.ToList();
        }

        return item;
    }

    public async Task<bool> CheckItemNumberExistsAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(itemNumber))
            return false;

        return await _itemRepository.ExistsByItemNumberAsync(accountId, companyCode.Trim().ToUpper(), itemNumber.Trim().ToUpper(), cancellationToken);
    }

    public async Task<ItemPayload> CreateItemAsync(ItemRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var itemNumber = request.ItemNumber.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new ItemPayload { Success = false, Message = "Company code is required." };

        if (string.IsNullOrWhiteSpace(itemNumber))
            return new ItemPayload { Success = false, Message = "Item number is required." };

        if (string.IsNullOrWhiteSpace(request.Name))
            return new ItemPayload { Success = false, Message = "Item name is required." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new ItemPayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _itemRepository.ExistsByItemNumberAsync(request.UserAccountId, companyCode, itemNumber, cancellationToken))
            return new ItemPayload { Success = false, Message = $"Item with Number [{itemNumber}] already exists for Company [{companyCode}]." };

        return await _itemRepository.RegisterItemTransactionAsync(request, cancellationToken);
    }

    public async Task<ItemPayload> UpdateItemAsync(ItemRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var itemNumber = request.ItemNumber.Trim().ToUpper();

        if (!await _itemRepository.ExistsByItemNumberAsync(request.UserAccountId, companyCode, itemNumber, cancellationToken))
            return new ItemPayload { Success = false, Message = $"Item [{itemNumber}] under Company [{companyCode}] could not be found." };

        return await _itemRepository.UpdateItemTransactionAsync(request, cancellationToken);
    }

    public async Task<ItemPayload> DeleteItemAsync(string accountId, string companyCode, string itemNumber, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var itmNum = itemNumber.Trim().ToUpper();

        if (!await _itemRepository.ExistsByItemNumberAsync(accountId, cCode, itmNum, cancellationToken))
            return new ItemPayload { Success = false, Message = $"Item [{itmNum}] under Company [{cCode}] could not be found." };

        return await _itemRepository.DeleteItemTransactionAsync(accountId, cCode, itmNum, userName, cancellationToken);
    }
}
