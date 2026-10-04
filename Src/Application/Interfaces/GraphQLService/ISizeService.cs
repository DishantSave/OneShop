using Application.DTOs.Masters.Size;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface ISizeService
{
    Task<SizePayload> CreateSizeAsync(SizeRequest request, CancellationToken cancellationToken = default);
    Task<SizePayload> UpdateSizeAsync(SizeRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<SizeDto>> GetSizesAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<SizeDto?> GetSizeByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<bool> CheckSizeCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<SizePayload> DeleteSizeAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
