using Application.DTOs.Catalog.Collection;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Catalog;

public class CollectionService(ICollectionRepository collectionRepository, ICompanyRepository companyRepository) : ICollectionService
{
    private readonly ICollectionRepository _collectionRepository = collectionRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<CollectionDto>> GetCollectionsAsync(string accountId, string? companyCode = null, string? channel = null, CancellationToken cancellationToken = default)
    {
        var collections = (await _collectionRepository.GetAllCollectionsAsync(accountId, companyCode, channel, cancellationToken)).ToList();
        foreach (var col in collections)
        {
            var items = await _collectionRepository.GetCollectionItemsAsync(accountId, col.CompanyCode, col.Code, cancellationToken);
            col.Items = items.ToList();
        }
        return collections;
    }

    public async Task<CollectionDto?> GetCollectionByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return null;

        var collection = await _collectionRepository.GetCollectionByCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
        if (collection != null)
        {
            var items = await _collectionRepository.GetCollectionItemsAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
            collection.Items = items.ToList();
        }
        return collection;
    }

    public async Task<bool> CheckCollectionCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(code))
            return false;

        return await _collectionRepository.ExistsByCollectionCodeAsync(accountId, companyCode.Trim().ToUpper(), code.Trim().ToUpper(), cancellationToken);
    }

    public async Task<CollectionPayload> CreateCollectionAsync(CollectionRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new CollectionPayload { Success = false, Message = "Company code is required." };

        if (string.IsNullOrWhiteSpace(code))
            return new CollectionPayload { Success = false, Message = "Collection code is required." };

        if (string.IsNullOrWhiteSpace(request.Name))
            return new CollectionPayload { Success = false, Message = "Collection name is required." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.UserAccountId, companyCode, cancellationToken))
            return new CollectionPayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _collectionRepository.ExistsByCollectionCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new CollectionPayload { Success = false, Message = $"Collection with code [{code}] already exists for Company [{companyCode}]." };

        return await _collectionRepository.RegisterCollectionTransactionAsync(request, cancellationToken);
    }

    public async Task<CollectionPayload> UpdateCollectionAsync(CollectionRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        var code = request.Code.Trim().ToUpper();

        if (!await _collectionRepository.ExistsByCollectionCodeAsync(request.UserAccountId, companyCode, code, cancellationToken))
            return new CollectionPayload { Success = false, Message = $"Collection [{code}] under Company [{companyCode}] could not be found." };

        return await _collectionRepository.UpdateCollectionTransactionAsync(request, cancellationToken);
    }

    public async Task<CollectionPayload> DeleteCollectionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var colCode = code.Trim().ToUpper();

        if (!await _collectionRepository.ExistsByCollectionCodeAsync(accountId, cCode, colCode, cancellationToken))
            return new CollectionPayload { Success = false, Message = $"Collection [{colCode}] under Company [{cCode}] could not be found." };

        return await _collectionRepository.DeleteCollectionTransactionAsync(accountId, cCode, colCode, userName, cancellationToken);
    }
}
