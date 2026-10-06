using Application.Common.Tenant;
using Application.DTOs.Address;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Address;

public class UserAddressRepository(IHttpContextAccessor httpContextAccessor) : IUserAddressRepository
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private string GetConnectionString()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null && context.Items.TryGetValue("TenantContext", out var tenantObj) && tenantObj is ITenantContext tenant)
        {
            return tenant.ConnectionString;
        }

        throw new InvalidOperationException("Tenant context could not be resolved for this request.");
    }

    public async Task<IEnumerable<UserAddressDto>> GetUserAddressesAsync(string accountId, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, UserName, AddressId, AddressType, ContactName, Phone,
                   AddressLine1, AddressLine2, City, State, PostalCode, Country, IsDefault, DateCreated
            FROM dbo.UserAddress
            WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName)
            ORDER BY IsDefault DESC, DateCreated DESC;";

        return await db.QueryAsync<UserAddressDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, UserName = userName.Trim() },
            cancellationToken: cancellationToken));
    }

    public async Task<UserAddressDto?> GetUserAddressByIdAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT TOP 1 Sequence, AccountId, UserName, AddressId, AddressType, ContactName, Phone,
                         AddressLine1, AddressLine2, City, State, PostalCode, Country, IsDefault, DateCreated
            FROM dbo.UserAddress
            WHERE AccountId = @AccountId 
              AND UPPER(UserName) = UPPER(@UserName)
              AND UPPER(AddressId) = UPPER(@AddressId);";

        return await db.QueryFirstOrDefaultAsync<UserAddressDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, UserName = userName.Trim(), AddressId = addressId.Trim() },
            cancellationToken: cancellationToken));
    }

    public async Task<UserAddressPayload> SaveUserAddressAsync(UserAddressRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            var addressId = string.IsNullOrWhiteSpace(request.AddressId) ? Guid.NewGuid().ToString("N")[..8].ToUpper() : request.AddressId.Trim().ToUpper();

            if (request.IsDefault)
            {
                const string unsetDefaultsSql = @"
                    UPDATE dbo.UserAddress
                    SET IsDefault = 0
                    WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";

                await db.ExecuteAsync(new CommandDefinition(
                    unsetDefaultsSql,
                    new { AccountId = request.AccountId, UserName = request.UserName.Trim() },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            const string upsertSql = @"
                IF EXISTS (
                    SELECT 1 FROM dbo.UserAddress 
                    WHERE AccountId = @AccountId 
                      AND UPPER(UserName) = UPPER(@UserName) 
                      AND UPPER(AddressId) = UPPER(@AddressId)
                )
                BEGIN
                    UPDATE dbo.UserAddress
                    SET AddressType = @AddressType,
                        ContactName = @ContactName,
                        Phone = @Phone,
                        AddressLine1 = @AddressLine1,
                        AddressLine2 = @AddressLine2,
                        City = @City,
                        State = @State,
                        PostalCode = @PostalCode,
                        Country = @Country,
                        IsDefault = @IsDefault
                    WHERE AccountId = @AccountId 
                      AND UPPER(UserName) = UPPER(@UserName) 
                      AND UPPER(AddressId) = UPPER(@AddressId);
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.UserAddress
                    (AccountId, UserName, AddressId, AddressType, ContactName, Phone, AddressLine1, AddressLine2, City, State, PostalCode, Country, IsDefault, DateCreated)
                    VALUES
                    (@AccountId, @UserName, @AddressId, @AddressType, @ContactName, @Phone, @AddressLine1, @AddressLine2, @City, @State, @PostalCode, @Country, @IsDefault, SYSDATETIME());
                END;";

            await db.ExecuteAsync(new CommandDefinition(
                upsertSql,
                new
                {
                    AccountId = request.AccountId,
                    UserName = request.UserName.Trim(),
                    AddressId = addressId,
                    AddressType = string.IsNullOrWhiteSpace(request.AddressType) ? "Office" : request.AddressType.Trim(),
                    ContactName = request.ContactName.Trim(),
                    Phone = request.Phone?.Trim(),
                    AddressLine1 = request.AddressLine1.Trim(),
                    AddressLine2 = request.AddressLine2?.Trim(),
                    City = request.City.Trim(),
                    State = request.State.Trim(),
                    PostalCode = request.PostalCode.Trim(),
                    Country = string.IsNullOrWhiteSpace(request.Country) ? "India" : request.Country.Trim(),
                    IsDefault = request.IsDefault
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            var updated = await GetUserAddressByIdAsync(request.AccountId, request.UserName, addressId, cancellationToken);

            return new UserAddressPayload
            {
                Success = true,
                Message = $"Address [{request.AddressType} - {request.ContactName}] saved successfully.",
                AddressDetails = updated
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new UserAddressPayload { Success = false, Message = $"Failed to save address: {ex.Message}" };
        }
    }

    public async Task<UserAddressPayload> DeleteUserAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            DELETE FROM dbo.UserAddress
            WHERE AccountId = @AccountId
              AND UPPER(UserName) = UPPER(@UserName)
              AND UPPER(AddressId) = UPPER(@AddressId);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = accountId, UserName = userName.Trim(), AddressId = addressId.Trim().ToUpper() },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new UserAddressPayload { Success = true, Message = "Address deleted successfully." };
        }

        return new UserAddressPayload { Success = false, Message = "Address was not found." };
    }

    public async Task<UserAddressPayload> SetDefaultAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string unsetSql = @"
                UPDATE dbo.UserAddress
                SET IsDefault = 0
                WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";

            await db.ExecuteAsync(new CommandDefinition(
                unsetSql,
                new { AccountId = accountId, UserName = userName.Trim() },
                transaction,
                cancellationToken: cancellationToken));

            const string setSql = @"
                UPDATE dbo.UserAddress
                SET IsDefault = 1
                WHERE AccountId = @AccountId 
                  AND UPPER(UserName) = UPPER(@UserName)
                  AND UPPER(AddressId) = UPPER(@AddressId);";

            var affected = await db.ExecuteAsync(new CommandDefinition(
                setSql,
                new { AccountId = accountId, UserName = userName.Trim(), AddressId = addressId.Trim().ToUpper() },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            if (affected > 0)
            {
                var updated = await GetUserAddressByIdAsync(accountId, userName, addressId, cancellationToken);
                return new UserAddressPayload { Success = true, Message = "Default address updated.", AddressDetails = updated };
            }

            return new UserAddressPayload { Success = false, Message = "Address not found." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new UserAddressPayload { Success = false, Message = $"Failed to update default address: {ex.Message}" };
        }
    }
}
