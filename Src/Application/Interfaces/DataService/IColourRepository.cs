using Application.DTOs.Masters.Colour;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IColourRepository
{
    Task<IEnumerable<ColourDto>> GetAllColoursAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<ColourDto?> GetColourByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<ColourAuditTrailDto>> GetAllColoursAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByColourCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<ColourPayload> RegisterColourTransactionAsync(ColourRequest request, CancellationToken cancellationToken = default);
    Task<ColourPayload> UpdateColourTransactionAsync(ColourRequest request, CancellationToken cancellationToken = default);
    Task<ColourPayload> DeleteColourTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
