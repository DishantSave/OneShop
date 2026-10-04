using Application.DTOs.Masters.Warehouse;
using Application.Interfaces.GraphQLService;
using HotChocolate.Authorization;
using System.Security.Claims;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class WarehouseQuery
{
    [Authorize]
    [GraphQLName("warehouses")]
    [GraphQLDescription("Get all warehouses for the current account, optionally filtered by company.")]
    public async Task<IEnumerable<WarehouseDto>> GetWarehousesAsync(
        [GraphQLName("companyCode")] string? companyCode,
        [Service] IWarehouseService warehouseService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await warehouseService.GetWarehousesAsync(accountId, companyCode, cancellationToken);
    }

    [Authorize]
    [GraphQLName("warehouse")]
    [GraphQLDescription("Get a single warehouse by company code and warehouse code with its audit trail.")]
    public async Task<WarehouseDto?> GetWarehouseAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IWarehouseService warehouseService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await warehouseService.GetWarehouseByCodeAsync(accountId, companyCode, code, cancellationToken);
    }

    [Authorize]
    [GraphQLName("checkWarehouseCodeExists")]
    [GraphQLDescription("Check if a warehouse code already exists within a specified company.")]
    public async Task<bool> CheckWarehouseCodeExistsAsync(
        [GraphQLName("companyCode")] string companyCode,
        [GraphQLName("code")] string code,
        [Service] IWarehouseService warehouseService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        var accountId = user.FindFirst("account_id")?.Value
            ?? throw new GraphQLException("AccountId not found in token.");

        return await warehouseService.CheckWarehouseCodeExistsAsync(accountId, companyCode, code, cancellationToken);
    }
}
