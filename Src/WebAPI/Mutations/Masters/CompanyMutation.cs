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
    [GraphQLName("createCompany")]
    [GraphQLDescription("Creates a new company.")]
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
                input.CompanyCode.Trim().ToUpper(),
                input.CompanyName.Trim(),
                input.CompanyDisplayName.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.Website?.Trim(),
                input.Logo?.Trim(),
                input.CurrencyCode.Trim(),
                input.TimeZone.Trim(),
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
                Message = $"An error occurred while creating the company: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("updateCompany")]
    [GraphQLDescription("Updates existing company details.")]
    public async Task<CompanyPayload> UpdateCompanyAsync(
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
                input.CompanyCode.Trim().ToUpper(),
                input.CompanyName.Trim(),
                input.CompanyDisplayName.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.Website?.Trim(),
                input.Logo?.Trim(),
                input.CurrencyCode.Trim(),
                input.TimeZone.Trim(),
                input.IsTestCompany,
                input.IsActive
            );

            return await companyService.UpdateCompanyAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CompanyPayload()
            {
                Success = false,
                Message = $"An error occurred while updating the company: {ex.Message}"
            };
        }
    }

    [Authorize]
    [GraphQLName("deleteCompany")]
    [GraphQLDescription("Deletes a company by code.")]
    public async Task<CompanyPayload> DeleteCompanyAsync(
        [GraphQLName("code")] string code,
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

            return await companyService.DeleteCompanyAsync(accountId, code.Trim().ToUpper(), userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new CompanyPayload()
            {
                Success = false,
                Message = $"An error occurred while deleting the company: {ex.Message}"
            };
        }
    }
}