using Application.DTOs.Masters.Country;

namespace Application.Interfaces.DataService;

public interface ICountryRepository
{
    Task<IEnumerable<CountryDto>> GetAllCountriesAsync(CancellationToken cancellationToken = default);
}