using Application.DTOs.Masters.Company;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class CompanyMutation
{
    [GraphQLDescription("Registers users and returns credentials on success.")]
    public async Task<CompanyPayload> CreateCompanyAsync(
        CompanyInput input,
        [Service] ICompanyService companyService,
        CancellationToken cancellationToken)
    {
        try
        {
            var request = new CompanyRequest(
                input.UserAccountId,
                input.UserName,
                input.CompanyCode,
                input.CompanyName,
                input.CompanyDisplayName,
                input.AddressLineOne,
                input.AddressLineTwo,
                input.City,
                input.StateCode,
                input.CountryCode,
                input.PostalCode,
                input.Contact,
                input.Email,
                input.Website,
                input.Logo,
                input.CurrencyCode,
                input.TimeZone,
                input.IsTestCompany,
                input.IsActive
            );

            return await companyService.CreateCompanyAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CompanyPayload()
            {
                Success = false,
                Message = $"An error occurred while creating the Company. Error: {ex.Message}"
            };
        }
    }
}