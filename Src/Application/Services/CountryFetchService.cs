using Application.DTOs.Masters.Country;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services;

public class CountryFetchService(ICountryRepository countryRepository) : ICountryFetchService
{
    readonly ICountryRepository _countryRepository = countryRepository;

    public async Task<IEnumerable<CountryDto>> GetCountriesAsync(CancellationToken cancellationToken = default)
    {
        return await _countryRepository.GetAllCountriesAsync(cancellationToken);
    }
}