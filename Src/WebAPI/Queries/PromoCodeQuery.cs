using Application.DTOs.Discounts;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class PromoCodeQuery
{
    [Authorize]
    [GraphQLName("promoCodes")]
    [GraphQLDescription("Get all promo codes for the current account.")]
    public async Task<IEnumerable<PromoCodeDto>> GetPromoCodesAsync(
        [GraphQLName("activeOnly")] bool? activeOnly,
        [Service] IPromoCodeService promoService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await promoService.GetPromoCodesAsync(accountId, activeOnly, cancellationToken);
    }

    [Authorize]
    [GraphQLName("promoCodeByCode")]
    [GraphQLDescription("Get details for a specific promo code.")]
    public async Task<PromoCodeDto?> GetPromoCodeByCodeAsync(
        [GraphQLName("code")] string code,
        [Service] IPromoCodeService promoService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await promoService.GetPromoCodeByCodeAsync(accountId, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("validatePromoCode")]
    [GraphQLDescription("Validate a promo code for checkout against a given order subtotal.")]
    public async Task<ValidatePromoPayload> ValidatePromoCodeAsync(
        [GraphQLName("code")] string code,
        [GraphQLName("subTotal")] decimal subTotal,
        [Service] IPromoCodeService promoService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var res = await promoService.ValidatePromoCodeAsync(accountId, code, subTotal, cancellationToken);
        return new ValidatePromoPayload
        {
            Success = res.IsValid,
            Message = res.Message,
            ValidationDetails = res
        };
    }
}
