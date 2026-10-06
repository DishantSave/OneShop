using Application.DTOs.Tax;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IStateTaxRepository
{
    Task<IEnumerable<StateTaxDto>> GetStateTaxesAsync(string accountId, string? countryCode = "IN", CancellationToken cancellationToken = default);
    Task<StateTaxDto?> GetStateTaxByCodeAsync(string accountId, string stateCode, string? countryCode = "IN", CancellationToken cancellationToken = default);
    Task<StateTaxPayload> SaveStateTaxAsync(StateTaxRequest request, CancellationToken cancellationToken = default);
    Task<StateTaxPayload> DeleteStateTaxAsync(string accountId, string stateCode, string? countryCode = "IN", CancellationToken cancellationToken = default);
}
