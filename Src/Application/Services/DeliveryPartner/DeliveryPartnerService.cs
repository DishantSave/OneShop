using Application.DTOs.DeliveryPartner;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.DeliveryPartner;

public class DeliveryPartnerService(IDeliveryPartnerRepository deliveryPartnerRepository) : IDeliveryPartnerService
{
    private readonly IDeliveryPartnerRepository _deliveryPartnerRepository = deliveryPartnerRepository;

    public async Task<IEnumerable<DeliveryPartnerDto>> GetDeliveryPartnersAsync(string accountId, string? companyCode = null, string? channel = null, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        return await _deliveryPartnerRepository.GetDeliveryPartnersAsync(accountId, companyCode, channel, isCustomer, cancellationToken);
    }

    public async Task<DeliveryPartnerDto?> GetDeliveryPartnerByIdAsync(string accountId, long sequence, CancellationToken cancellationToken = default)
    {
        return await _deliveryPartnerRepository.GetDeliveryPartnerByIdAsync(accountId, sequence, cancellationToken);
    }

    public async Task<DeliveryPartnerPayload> SaveDeliveryPartnerAsync(string accountId, string userName, DeliveryPartnerRequest request, long? sequence = null, CancellationToken cancellationToken = default)
    {
        return await _deliveryPartnerRepository.SaveDeliveryPartnerAsync(accountId, userName, request, sequence, cancellationToken);
    }

    public async Task<DeliveryPartnerPayload> DeleteDeliveryPartnerAsync(string accountId, long sequence, CancellationToken cancellationToken = default)
    {
        return await _deliveryPartnerRepository.DeleteDeliveryPartnerAsync(accountId, sequence, cancellationToken);
    }

    public async Task<ShippingCalculationResult> CalculateShippingAsync(string accountId, string companyCode, string channel, decimal orderSubTotal, int totalItems, CancellationToken cancellationToken = default)
    {
        return await _deliveryPartnerRepository.CalculateShippingAsync(accountId, companyCode, channel, orderSubTotal, totalItems, cancellationToken);
    }
}
