using Application.DTOs.Order;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IOrderRepository
{
    Task<IEnumerable<OrderDto>> GetOrdersAsync(string accountId, string? companyCode = null, string? status = null, string? locationCode = null, string? channel = null, CancellationToken cancellationToken = default);
    Task<OrderDto?> GetOrderByIdAsync(string accountId, string companyCode, string orderId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByOrderIdAsync(string accountId, string companyCode, string orderId, CancellationToken cancellationToken = default);
    Task<OrderPayload> CreateOrderTransactionAsync(OrderRequest request, CancellationToken cancellationToken = default);
    Task<OrderPayload> CreateBatchOrdersTransactionAsync(List<OrderRequest> requests, CancellationToken cancellationToken = default);
    Task<OrderPayload> UpdateOrderStatusAsync(string accountId, string companyCode, string orderId, string status, string userName, CancellationToken cancellationToken = default);
    Task<OrderPayload> DeleteOrderAsync(string accountId, string companyCode, string orderId, string userName, CancellationToken cancellationToken = default);
}
