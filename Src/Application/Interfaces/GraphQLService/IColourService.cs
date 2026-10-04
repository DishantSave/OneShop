using Application.DTOs.Masters.Colour;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IColourService
{
    Task<ColourPayload> CreateColourAsync(ColourRequest request, CancellationToken cancellationToken = default);
    Task<ColourPayload> UpdateColourAsync(ColourRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<ColourDto>> GetColoursAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default);
    Task<ColourDto?> GetColourByCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<bool> CheckColourCodeExistsAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default);
    Task<ColourPayload> DeleteColourAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default);
}
