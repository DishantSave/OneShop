using Application.DTOs.DeliveryPartner;

namespace Application.Interfaces.GraphQLService;

public interface IDeliveryPartnerService
{
    Task<IEnumerable<DeliveryPartnerDto>> GetDeliveryPartnersAsync(string accountId, string? companyCode = null, string? channel = null, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<DeliveryPartnerDto?> GetDeliveryPartnerByIdAsync(string accountId, long sequence, CancellationToken cancellationToken = default);
    Task<DeliveryPartnerPayload> SaveDeliveryPartnerAsync(string accountId, string userName, DeliveryPartnerRequest request, long? sequence = null, CancellationToken cancellationToken = default);
    Task<DeliveryPartnerPayload> DeleteDeliveryPartnerAsync(string accountId, long sequence, CancellationToken cancellationToken = default);
    Task<ShippingCalculationResult> CalculateShippingAsync(string accountId, string companyCode, string channel, decimal orderSubTotal, int totalItems, CancellationToken cancellationToken = default);
}
