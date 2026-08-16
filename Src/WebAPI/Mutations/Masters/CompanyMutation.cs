using Application.DTOs.Masters.Company;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class CompanyMutation
{
    [Authorize]
    [GraphQLDescription("Registers users and returns credentials on success.")]
    public async Task<CompanyPayload> CreateCompanyAsync(
        CompanyInput input,
        ClaimsPrincipal user,
        [Service] ICompanyService companyService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new CompanyRequest(
                accountId,
                userName,
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