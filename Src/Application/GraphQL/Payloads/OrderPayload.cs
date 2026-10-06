using Application.DTOs.Order;

namespace Application.GraphQL.Payloads;

public class OrderPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public OrderDto? OrderDetails { get; init; }
    public List<string>? SegregatedOrderIds { get; init; }
}
