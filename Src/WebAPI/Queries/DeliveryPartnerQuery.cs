using Application.DTOs.DeliveryPartner;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class DeliveryPartnerQuery
{
    [Authorize]
    [GraphQLName("deliveryPartners")]
    [GraphQLDescription("Get all configured delivery partners and shipping rules with optional company and channel filters.")]
    public async Task<IEnumerable<DeliveryPartnerDto>> GetDeliveryPartnersAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [GraphQLName("channel")] string? channel,
        [Service] IDeliveryPartnerService deliveryPartnerService,
        [Service] IUserRoleResolver userRoleResolver,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var isCustomer = await userRoleResolver.IsCustomerAsync(user, cancellationToken);
        return await deliveryPartnerService.GetDeliveryPartnersAsync(accountId, companyCode, channel, isCustomer, cancellationToken);
    }

    [Authorize]
    [GraphQLName("calculateShipping")]
    [GraphQLDescription("Calculate shipping charge and automatically assign delivery partner based on store vendor rules.")]
    public async Task<ShippingCalculationResult> CalculateShippingAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("channel")] string channel,
        [GraphQLName("subTotal")] decimal subTotal,
        [GraphQLName("totalItems")] int totalItems,
        [Service] IDeliveryPartnerService deliveryPartnerService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await deliveryPartnerService.CalculateShippingAsync(accountId, companyCode, channel, subTotal, totalItems, cancellationToken);
    }
}
