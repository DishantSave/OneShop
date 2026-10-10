using Application.DTOs.Discounts;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Discounts;

public class PromoCodeService(IPromoCodeRepository repository) : IPromoCodeService
{
    private readonly IPromoCodeRepository _repository = repository;

    public Task<IEnumerable<PromoCodeDto>> GetPromoCodesAsync(string accountId, bool? activeOnly = null, bool isCustomer = false, CancellationToken cancellationToken = default)
        => _repository.GetPromoCodesAsync(accountId, activeOnly, isCustomer, cancellationToken);

    public Task<PromoCodeDto?> GetPromoCodeByCodeAsync(string accountId, string code, bool isCustomer = false, CancellationToken cancellationToken = default)
        => _repository.GetPromoCodeByCodeAsync(accountId, code, isCustomer, cancellationToken);

    public Task<PromoCodePayload> SavePromoCodeAsync(PromoCodeRequest request, CancellationToken cancellationToken = default)
        => _repository.SavePromoCodeAsync(request, cancellationToken);

    public Task<PromoCodePayload> DeletePromoCodeAsync(string accountId, string code, CancellationToken cancellationToken = default)
        => _repository.DeletePromoCodeAsync(accountId, code, cancellationToken);

    public Task<PromoValidationResultDto> ValidatePromoCodeAsync(string accountId, string code, decimal orderSubTotal, bool isCustomer = false, CancellationToken cancellationToken = default)
        => _repository.ValidatePromoCodeAsync(accountId, code, orderSubTotal, isCustomer, cancellationToken);
}
