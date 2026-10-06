using Application.DTOs.Discounts;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class PromoCodeMutation
{
    [Authorize]
    [GraphQLName("savePromoCode")]
    [GraphQLDescription("Create or update a promotional discount code.")]
    public async Task<PromoCodePayload> SavePromoCodeAsync(
        PromoCodeInput input,
        ClaimsPrincipal user,
        [Service] IPromoCodeService promoService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new PromoCodeRequest(
                accountId,
                input.Code.Trim().ToUpper(),
                input.Description?.Trim(),
                string.IsNullOrWhiteSpace(input.DiscountType) ? "Percentage" : input.DiscountType.Trim(),
                input.DiscountValue,
                input.MinOrderAmount,
                input.MaxDiscountAmount,
                input.ValidFrom,
                input.ValidUntil,
                input.UsageLimit,
                input.IsActive,
                userName
            );

            return await promoService.SavePromoCodeAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new PromoCodePayload { Success = false, Message = $"Error saving promo code: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deletePromoCode")]
    [GraphQLDescription("Delete a promotional discount code.")]
    public async Task<PromoCodePayload> DeletePromoCodeAsync(
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] IPromoCodeService promoService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            return await promoService.DeletePromoCodeAsync(accountId, code, cancellationToken);
        }
        catch (Exception ex)
        {
            return new PromoCodePayload { Success = false, Message = $"Error deleting promo code: {ex.Message}" };
        }
    }
}
