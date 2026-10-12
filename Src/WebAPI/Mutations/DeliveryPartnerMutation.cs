using Application.DTOs.DeliveryPartner;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations;

public class DeliveryPartnerInput
{
    public long? Sequence { get; set; }
    public string CompanyCode { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public string Channel { get; set; } = "B2C";
    public string? ItemCategory { get; set; } = "ALL";
    public decimal BaseShippingRate { get; set; } = 5.00m;
    public decimal PerItemShippingRate { get; set; } = 1.00m;
    public decimal FreeShippingThreshold { get; set; } = 500.00m;
    public int EstimatedDays { get; set; } = 3;
    public bool IsDefault { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

[ExtendObjectType("Mutation")]
public class DeliveryPartnerMutation
{
    [Authorize]
    [GraphQLName("saveDeliveryPartner")]
    [GraphQLDescription("Create or update a delivery partner and shipping rule.")]
    public async Task<DeliveryPartnerPayload> SaveDeliveryPartnerAsync(
        DeliveryPartnerInput input,
        ClaimsPrincipal user,
        [Service] IDeliveryPartnerService deliveryPartnerService,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        var userName = user.FindFirst("user_name")?.Value ?? "Vendor";

        var request = new DeliveryPartnerRequest(
            input.CompanyCode.Trim().ToUpper(),
            input.PartnerName.Trim(),
            string.IsNullOrWhiteSpace(input.Channel) ? "B2C" : input.Channel.Trim(),
            string.IsNullOrWhiteSpace(input.ItemCategory) ? "ALL" : input.ItemCategory.Trim(),
            input.BaseShippingRate,
            input.PerItemShippingRate,
            input.FreeShippingThreshold,
            input.EstimatedDays > 0 ? input.EstimatedDays : 3,
            input.IsDefault,
            input.IsActive
        );

        return await deliveryPartnerService.SaveDeliveryPartnerAsync(accountId, userName, request, input.Sequence, cancellationToken);
    }

    [Authorize]
    [GraphQLName("deleteDeliveryPartner")]
    [GraphQLDescription("Delete a delivery partner by sequence.")]
    public async Task<DeliveryPartnerPayload> DeleteDeliveryPartnerAsync(
        long sequence,
        ClaimsPrincipal user,
        [Service] IDeliveryPartnerService deliveryPartnerService,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await deliveryPartnerService.DeleteDeliveryPartnerAsync(accountId, sequence, cancellationToken);
    }
}
