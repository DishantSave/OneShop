using Application.DTOs.Order;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Order;

public class OrderService(IOrderRepository orderRepository, ICompanyRepository companyRepository) : IOrderService
{
    private readonly IOrderRepository _orderRepository = orderRepository;
    private readonly ICompanyRepository _companyRepository = companyRepository;

    public async Task<IEnumerable<OrderDto>> GetOrdersAsync(string accountId, string? companyCode = null, string? status = null, string? locationCode = null, string? channel = null, CancellationToken cancellationToken = default)
    {
        return await _orderRepository.GetOrdersAsync(accountId, companyCode, status, locationCode, channel, cancellationToken);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(string accountId, string companyCode, string orderId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(orderId))
            return null;

        return await _orderRepository.GetOrderByIdAsync(accountId, companyCode.Trim().ToUpper(), orderId.Trim().ToUpper(), cancellationToken);
    }

    public async Task<OrderPayload> CreateOrderAsync(OrderRequest request, CancellationToken cancellationToken = default)
    {
        var companyCode = request.CompanyCode.Trim().ToUpper();
        if (string.IsNullOrWhiteSpace(companyCode))
            return new OrderPayload { Success = false, Message = "Company code is required." };

        if (!await _companyRepository.ExistsByCompanyCodeAsync(request.AccountId, companyCode, cancellationToken))
            return new OrderPayload { Success = false, Message = $"Company [{companyCode}] does not exist." };

        if (string.IsNullOrWhiteSpace(request.LocationCode))
            return new OrderPayload { Success = false, Message = "Location (Store or Warehouse) is required." };

        if (request.Items == null || request.Items.Count == 0)
            return new OrderPayload { Success = false, Message = "At least one item must be added to the order." };

        var orderId = string.IsNullOrWhiteSpace(request.OrderId)
            ? $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : request.OrderId.Trim().ToUpper();

        var normalizedRequest = request with
        {
            CompanyCode = companyCode,
            OrderId = orderId,
            LocationCode = request.LocationCode.Trim().ToUpper()
        };

        return await _orderRepository.CreateOrderTransactionAsync(normalizedRequest, cancellationToken);
    }

    public async Task<OrderPayload> CreateBatchOrdersAsync(List<OrderRequest> requests, CancellationToken cancellationToken = default)
    {
        if (requests == null || requests.Count == 0)
            return new OrderPayload { Success = false, Message = "No orders provided for batch checkout." };

        // Segregated Order naming: OrderId, OrderId.2, OrderId.3 ...
        var baseOrderId = string.IsNullOrWhiteSpace(requests[0].OrderId)
            ? $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
            : requests[0].OrderId.Trim().ToUpper();

        var normalizedRequests = new List<OrderRequest>();
        for (int i = 0; i < requests.Count; i++)
        {
            var req = requests[i];
            var cCode = req.CompanyCode.Trim().ToUpper();
            if (string.IsNullOrWhiteSpace(cCode))
                return new OrderPayload { Success = false, Message = $"Company code is required for order at index {i + 1}." };

            var assignedOrderId = (i == 0) ? baseOrderId : $"{baseOrderId}.{i + 1}";

            normalizedRequests.Add(req with
            {
                CompanyCode = cCode,
                OrderId = assignedOrderId,
                ParentOrderId = (i == 0) ? null : baseOrderId,
                LocationCode = req.LocationCode.Trim().ToUpper()
            });
        }

        return await _orderRepository.CreateBatchOrdersTransactionAsync(normalizedRequests, cancellationToken);
    }

    public async Task<OrderPayload> UpdateOrderStatusAsync(string accountId, string companyCode, string orderId, string status, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(orderId))
            return new OrderPayload { Success = false, Message = "Invalid order identifier." };

        return await _orderRepository.UpdateOrderStatusAsync(accountId, companyCode.Trim().ToUpper(), orderId.Trim().ToUpper(), status, userName, cancellationToken);
    }

    public async Task<OrderPayload> DeleteOrderAsync(string accountId, string companyCode, string orderId, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(companyCode) || string.IsNullOrWhiteSpace(orderId))
            return new OrderPayload { Success = false, Message = "Invalid order identifier." };

        return await _orderRepository.DeleteOrderAsync(accountId, companyCode.Trim().ToUpper(), orderId.Trim().ToUpper(), userName, cancellationToken);
    }
}
