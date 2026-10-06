using Application.DTOs.Tax;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Tax;

public class StateTaxService(IStateTaxRepository repository) : IStateTaxService
{
    private readonly IStateTaxRepository _repository = repository;

    public Task<IEnumerable<StateTaxDto>> GetStateTaxesAsync(string accountId, string? countryCode = "IN", CancellationToken cancellationToken = default)
        => _repository.GetStateTaxesAsync(accountId, countryCode, cancellationToken);

    public Task<StateTaxDto?> GetStateTaxByCodeAsync(string accountId, string stateCode, string? countryCode = "IN", CancellationToken cancellationToken = default)
        => _repository.GetStateTaxByCodeAsync(accountId, stateCode, countryCode, cancellationToken);

    public Task<StateTaxPayload> SaveStateTaxAsync(StateTaxRequest request, CancellationToken cancellationToken = default)
        => _repository.SaveStateTaxAsync(request, cancellationToken);

    public Task<StateTaxPayload> DeleteStateTaxAsync(string accountId, string stateCode, string? countryCode = "IN", CancellationToken cancellationToken = default)
        => _repository.DeleteStateTaxAsync(accountId, stateCode, countryCode, cancellationToken);
}
