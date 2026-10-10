using Application.DTOs.Masters.Warehouse;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IWarehouseService
{
    Task<WarehousePayload> CreateWarehouseAsync(WarehouseRequest request, CancellationToken cancellationToken = default);
    Task<WarehousePayload> UpdateWarehouseAsync(WarehouseRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<WarehouseDto>> GetWarehousesAsync(string accountId, string? companyCode = null, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<WarehouseDto?> GetWarehouseByCodeAsync(string accountId, string companyCode, string code, bool isCustomer = false, CancellationToken cancellationToken = default);
    Task<bool> CheckWarehouseCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<WarehousePayload> DeleteWarehouseAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
