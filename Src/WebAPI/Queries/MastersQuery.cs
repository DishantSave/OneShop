using Application.DTOs.Masters.Country;
using Application.Interfaces.GraphQLService;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class MastersQuery
{
    [GraphQLDescription("Get Countries.")]
    public async Task<IEnumerable<CountryDto>> GetCountriesAsync(
    [Service] ICountryFetchService countryFetchService,
    CancellationToken cancellationToken)
    {
        return await countryFetchService.GetCountriesAsync(cancellationToken);
    }
}