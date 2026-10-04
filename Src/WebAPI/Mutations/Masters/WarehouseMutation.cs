using Application.DTOs.Masters.Warehouse;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Mutations.Masters;

[ExtendObjectType("Mutation")]
public class WarehouseMutation
{
    [Authorize]
    [GraphQLName("createWarehouse")]
    [GraphQLDescription("Creates a new warehouse.")]
    public async Task<WarehousePayload> CreateWarehouseAsync(
        WarehouseInput input,
        ClaimsPrincipal user,
        [Service] IWarehouseService warehouseService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new WarehouseRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.DisplayName.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.IsTestWarehouse,
                input.IsActive
            );

            return await warehouseService.CreateWarehouseAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new WarehousePayload { Success = false, Message = $"An error occurred while creating the warehouse: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("updateWarehouse")]
    [GraphQLDescription("Updates an existing warehouse.")]
    public async Task<WarehousePayload> UpdateWarehouseAsync(
        WarehouseInput input,
        ClaimsPrincipal user,
        [Service] IWarehouseService warehouseService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            var request = new WarehouseRequest(
                accountId,
                userName,
                input.CompanyCode.Trim().ToUpper(),
                input.Code.Trim().ToUpper(),
                input.Name.Trim(),
                input.DisplayName.Trim(),
                input.AddressLineOne.Trim(),
                input.AddressLineTwo?.Trim(),
                input.City.Trim(),
                input.StateCode.Trim(),
                input.CountryCode.Trim().ToUpper(),
                input.PostalCode.Trim(),
                input.Contact.Trim(),
                input.Email.Trim(),
                input.IsTestWarehouse,
                input.IsActive
            );

            return await warehouseService.UpdateWarehouseAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new WarehousePayload { Success = false, Message = $"An error occurred while updating the warehouse: {ex.Message}" };
        }
    }

    [Authorize]
    [GraphQLName("deleteWarehouse")]
    [GraphQLDescription("Deletes an existing warehouse.")]
    public async Task<WarehousePayload> DeleteWarehouseAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        ClaimsPrincipal user,
        [Service] IWarehouseService warehouseService,
        CancellationToken cancellationToken)
    {
        try
        {
            var accountId = user.FindFirst("account_id")?.Value
                ?? throw new GraphQLException("AccountId not found in token.");

            var userName = user.FindFirst("user_name")?.Value
                ?? throw new GraphQLException("User Name not found in token.");

            return await warehouseService.DeleteWarehouseAsync(accountId, companyCode, code, userName, cancellationToken);
        }
        catch (Exception ex)
        {
            return new WarehousePayload { Success = false, Message = $"An error occurred while deleting the warehouse: {ex.Message}" };
        }
    }
}
