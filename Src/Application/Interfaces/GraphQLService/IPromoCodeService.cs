using Application.DTOs.Discounts;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IPromoCodeService
{
    Task<IEnumerable<PromoCodeDto>> GetPromoCodesAsync(string accountId, bool? activeOnly = null, CancellationToken cancellationToken = default);
    Task<PromoCodeDto?> GetPromoCodeByCodeAsync(string accountId, string code, CancellationToken cancellationToken = default);
    Task<PromoCodePayload> SavePromoCodeAsync(PromoCodeRequest request, CancellationToken cancellationToken = default);
    Task<PromoCodePayload> DeletePromoCodeAsync(string accountId, string code, CancellationToken cancellationToken = default);
    Task<PromoValidationResultDto> ValidatePromoCodeAsync(string accountId, string code, decimal orderSubTotal, CancellationToken cancellationToken = default);
}
