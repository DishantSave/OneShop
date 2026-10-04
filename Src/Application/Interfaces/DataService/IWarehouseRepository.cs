using Application.DTOs.Masters.Warehouse;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IWarehouseRepository
{
    Task<IEnumerable<WarehouseDto>> GetAllWarehousesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<WarehouseDto?> GetWarehouseByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<WarehouseAuditTrailDto>> GetAllWarehousesAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByWarehouseCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<WarehousePayload> RegisterWarehouseTransactionAsync(WarehouseRequest request, CancellationToken cancellationToken = default);
    Task<WarehousePayload> UpdateWarehouseTransactionAsync(WarehouseRequest request, CancellationToken cancellationToken = default);
    Task<WarehousePayload> DeleteWarehouseTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
