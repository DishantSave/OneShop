using Application.DTOs.Order;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IOrderService
{
    Task<IEnumerable<OrderDto>> GetOrdersAsync(string accountId, string? companyCode = null, string? status = null, string? locationCode = null, string? channel = null, string? createdBy = null, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<OrderDto?> GetOrderByIdAsync(string accountId, string companyCode, string orderId, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<IEnumerable<OrderAuditTrailDto>> GetOrderAuditTrailAsync(string accountId, string companyCode, string orderId, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<OrderPayload> CreateOrderAsync(OrderRequest request, CancellationToken cancellationToken = default);
    Task<OrderPayload> CreateBatchOrdersAsync(List<OrderRequest> requests, CancellationToken cancellationToken = default);
    Task<OrderPayload> UpdateOrderDetailsAsync(string accountId, UpdateOrderDetailsInput input, string userName, CancellationToken cancellationToken = default);
    Task<OrderPayload> AddOrderTimelineCommentAsync(string accountId, AddOrderTimelineCommentInput input, string userName, CancellationToken cancellationToken = default);
    Task<OrderPayload> UpdateOrderStatusAsync(string accountId, string companyCode, string orderId, string status, string userName, string? userRole = null, CancellationToken cancellationToken = default);
    Task<OrderPayload> DeleteOrderAsync(string accountId, string companyCode, string orderId, string userName, CancellationToken cancellationToken = default);
}
