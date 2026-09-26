using Application.DTOs.Masters.Store;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Masters;

public class StoreService(IStoreRepository storeRepository, ICompanyRepository companyRepository) : IStoreService
{
    private readonly IStoreRepository _storeRepository = storeRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<StoreDto>> GetStoresAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        var storeDetails = (await _storeRepository.GetAllStoresAsync(accountId, companyCode, cancellationToken)).ToList();
        var storeAuditDetails = await _storeRepository.GetAllStoresAuditDetailsAsync(accountId, companyCode, cancellationToken);

        var auditLookup = storeAuditDetails.ToLookup(sa => $"{sa.CompanyCode}:{sa.StoreCode}");

        foreach (var store in storeDetails)
        {
            var key = $"{store.CompanyCode}:{store.Code}";
            store.Audit.AddRange(auditLookup[key]);
        }

        return storeDetails;
    }

    public async Task<StoreDto?> GetStoreByCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(storeCode))
            return null;

        return await _storeRepository.GetStoreByCodeAsync(accountId, companyCode.Trim().ToUpper(), storeCode.Trim().ToUpper(), cancellationToken);
    }

    public async Task<bool> CheckStoreCodeExistsAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(storeCode))
            return false;

        return await _storeRepository.ExistsByStoreCodeAsync(accountId, companyCode.Trim().ToUpper(), storeCode.Trim().ToUpper(), cancellationToken);
    }

    public async Task<StorePayload> CreateStoreAsync(StoreRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.companyCode.Trim().ToUpper();
        var code = request.storeCode.Trim().ToUpper();

        if (string.IsNullOrWhiteSpace(companyCode))
            return new StorePayload { Success = false, Message = "Company code is required." };

        if (code.Length < 2 || code.Length > 4)
            return new StorePayload { Success = false, Message = "Store code must be between 2 and 4 characters." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.userAccountId, companyCode, cancellationToken))
            return new StorePayload { Success = false, Message = $"Parent Company [{companyCode}] does not exist." };

        if (await _storeRepository.ExistsByStoreCodeAsync(request.userAccountId, companyCode, code, cancellationToken))
            return new StorePayload { Success = false, Message = $"Store with code [{code}] already exists for Company [{companyCode}]." };

        return await _storeRepository.RegisterStoreTransactionAsync(
            request.userAccountId,
            request.userName,
            companyCode,
            code,
            request.storeName.Trim(),
            request.storeDisplayName.Trim(),
            request.storeType.Trim(),
            request.addressLineOne.Trim(),
            request.addressLineTwo?.Trim(),
            request.city.Trim(),
            request.stateCode.Trim(),
            request.countryCode.Trim().ToUpper(),
            request.postalCode.Trim(),
            request.contact.Trim(),
            request.email.Trim(),
            request.website?.Trim(),
            request.logo?.Trim(),
            request.currencyCode.Trim(),
            request.timeZone.Trim(),
            request.isTestStore,
            request.isActive,
            cancellationToken
        );
    }

    public async Task<StorePayload> UpdateStoreAsync(StoreRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.companyCode.Trim().ToUpper();
        var code = request.storeCode.Trim().ToUpper();

        if (!await _storeRepository.ExistsByStoreCodeAsync(request.userAccountId, companyCode, code, cancellationToken))
            return new StorePayload { Success = false, Message = $"Store [{code}] under Company [{companyCode}] could not be found." };

        return await _storeRepository.UpdateStoreTransactionAsync(
            request.userAccountId,
            request.userName,
            companyCode,
            code,
            request.storeName.Trim(),
            request.storeDisplayName.Trim(),
            request.storeType.Trim(),
            request.addressLineOne.Trim(),
            request.addressLineTwo?.Trim(),
            request.city.Trim(),
            request.stateCode.Trim(),
            request.countryCode.Trim().ToUpper(),
            request.postalCode.Trim(),
            request.contact.Trim(),
            request.email.Trim(),
            request.website?.Trim(),
            request.logo?.Trim(),
            request.currencyCode.Trim(),
            request.timeZone.Trim(),
            request.isTestStore,
            request.isActive,
            cancellationToken
        );
    }

    public async Task<StorePayload> DeleteStoreAsync(string accountId, string companyCode, string storeCode, string userName, CancellationToken cancellationToken = default)
    {
        var cCode = companyCode.Trim().ToUpper();
        var sCode = storeCode.Trim().ToUpper();

        if (!await _storeRepository.ExistsByStoreCodeAsync(accountId, cCode, sCode, cancellationToken))
            return new StorePayload { Success = false, Message = $"Store [{sCode}] under Company [{cCode}] could not be found." };

        return await _storeRepository.DeleteStoreTransactionAsync(accountId, cCode, sCode, userName, cancellationToken);
    }
}
