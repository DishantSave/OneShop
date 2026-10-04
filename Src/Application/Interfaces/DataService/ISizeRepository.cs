using Application.DTOs.Masters.Size;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface ISizeRepository
{
    Task<IEnumerable<SizeDto>> GetAllSizesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<SizeDto?> GetSizeByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<SizeAuditTrailDto>> GetAllSizesAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySizeCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<SizePayload> RegisterSizeTransactionAsync(SizeRequest request, CancellationToken cancellationToken = default);
    Task<SizePayload> UpdateSizeTransactionAsync(SizeRequest request, CancellationToken cancellationToken = default);
    Task<SizePayload> DeleteSizeTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
