using Application.DTOs.Masters.Country;

namespace Application.Interfaces.GraphQLService;

public interface ICountryFetchService
{
    Task<IEnumerable<CountryDto>> GetCountriesAsync(CancellationToken cancellationToken = default);
}