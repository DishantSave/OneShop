using Application.Common.Tenant;
using Application.DTOs.Catalog.Item;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Catalog;

public class ItemRepository(IHttpContextAccessor httpContextAccessor) : IItemRepository
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

    public async Task<IEnumerable<ItemDto>> GetAllItemsAsync(string accountId, string? companyCode = null, string? salesChannel = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT i.Sequence, i.AccountId, i.CompanyCode, c.Name AS CompanyName, i.ItemNumber, i.Name,
                   i.DisplayName, i.Description, i.Category, i.SalesChannel, i.B2CPrice, i.B2CCompareAtPrice,
                   i.B2BPrice, i.B2BMinQuantity, i.UnitOfMeasure, i.Season, i.Brand, i.Tags, i.Images,
                   i.IsActive, i.DateCreated
            FROM dbo.Item AS i
            INNER JOIN dbo.Company AS c ON i.AccountId = c.AccountId AND i.CompanyCode = c.Code
            WHERE i.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(i.CompanyCode) = UPPER(@CompanyCode))
              AND (@SalesChannel IS NULL OR i.SalesChannel = @SalesChannel OR i.SalesChannel = 'Both')
            ORDER BY i.CompanyCode ASC, i.ItemNumber ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, SalesChannel = salesChannel },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<ItemDto>(command);
    }

    public async Task<ItemDto?> GetItemByNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT i.Sequence, i.AccountId, i.CompanyCode, c.Name AS CompanyName, i.ItemNumber, i.Name,
                   i.DisplayName, i.Description, i.Category, i.SalesChannel, i.B2CPrice, i.B2CCompareAtPrice,
                   i.B2BPrice, i.B2BMinQuantity, i.UnitOfMeasure, i.Season, i.Brand, i.Tags, i.Images,
                   i.IsActive, i.DateCreated
            FROM dbo.Item AS i
            INNER JOIN dbo.Company AS c ON i.AccountId = c.AccountId AND i.CompanyCode = c.Code
            WHERE i.AccountId = @AccountId
              AND UPPER(i.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(i.ItemNumber) = UPPER(@ItemNumber)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber },
            cancellationToken: cancellationToken);

        return await db.QueryFirstOrDefaultAsync<ItemDto>(command);
    }

    public async Task<IEnumerable<ItemVariantDto>> GetItemVariantsAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT v.Sequence, v.AccountId, v.CompanyCode, v.ItemNumber,
                   v.ColourCode, clr.Name AS ColourName, clr.HexCode AS ColourHex,
                   v.SizeCode, s.Name AS SizeName,
                   v.Sku, v.Barcode, v.AdditionalPrice, v.IsActive, v.DateCreated
            FROM dbo.ItemVariant AS v
            LEFT JOIN dbo.Colour AS clr ON v.AccountId = clr.AccountId AND v.CompanyCode = clr.CompanyCode AND v.ColourCode = clr.Code
            LEFT JOIN dbo.Size AS s ON v.AccountId = s.AccountId AND v.CompanyCode = s.CompanyCode AND v.SizeCode = s.Code
            WHERE v.AccountId = @AccountId
              AND UPPER(v.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(v.ItemNumber) = UPPER(@ItemNumber)
            ORDER BY v.ColourCode ASC, s.SortOrder ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<ItemVariantDto>(command);
    }

    public async Task<IEnumerable<ItemAuditTrailDto>> GetAllItemsAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, ItemNumber, Field, Description, DateModified, ModifiedBy
            FROM dbo.ItemAuditTrail
            WHERE AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(CompanyCode) = UPPER(@CompanyCode))
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<ItemAuditTrailDto>(command);
    }

    public async Task<bool> ExistsByItemNumberAsync(string accountId, string companyCode, string itemNumber, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Item
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(ItemNumber) = UPPER(@ItemNumber)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber },
            cancellationToken: cancellationToken);

        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<ItemPayload> RegisterItemTransactionAsync(ItemRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string insertSql = @"
                INSERT INTO dbo.Item
                (AccountId, CompanyCode, ItemNumber, Name, DisplayName, Description, Category, SalesChannel,
                 B2CPrice, B2CCompareAtPrice, B2BPrice, B2BMinQuantity, UnitOfMeasure, Season, Brand, Tags, Images, IsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @ItemNumber, @Name, @DisplayName, @Description, @Category, @SalesChannel,
                 @B2CPrice, @B2CCompareAtPrice, @B2BPrice, @B2BMinQuantity, @UnitOfMeasure, @Season, @Brand, @Tags, @Images, @IsActive, SYSDATETIME());";

            await db.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    Name = request.Name,
                    DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? request.Name : request.DisplayName,
                    Description = request.Description,
                    Category = request.Category,
                    SalesChannel = request.SalesChannel,
                    B2CPrice = request.B2cPrice,
                    B2CCompareAtPrice = request.B2cCompareAtPrice,
                    B2BPrice = request.B2bPrice,
                    B2BMinQuantity = request.B2bMinQuantity < 1 ? 1 : request.B2bMinQuantity,
                    UnitOfMeasure = string.IsNullOrWhiteSpace(request.UnitOfMeasure) ? "PCS" : request.UnitOfMeasure,
                    Season = request.Season,
                    Brand = request.Brand,
                    Tags = request.Tags,
                    Images = request.Images,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            // Insert Variants if any
            if (request.Variants is { Count: > 0 })
            {
                const string insertVarSql = @"
                    INSERT INTO dbo.ItemVariant
                    (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, Sku, Barcode, AdditionalPrice, IsActive, DateCreated)
                    VALUES
                    (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @Sku, @Barcode, @AdditionalPrice, @IsActive, SYSDATETIME());";

                foreach (var v in request.Variants)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertVarSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            ItemNumber = request.ItemNumber.ToUpper(),
                            ColourCode = v.ColourCode.ToUpper(),
                            SizeCode = v.SizeCode.ToUpper(),
                            Sku = v.Sku,
                            Barcode = v.Barcode,
                            AdditionalPrice = v.AdditionalPrice,
                            IsActive = v.IsActive
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            const string auditSql = @"
                INSERT INTO dbo.ItemAuditTrail
                (AccountId, CompanyCode, ItemNumber, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ItemNumber, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    Field = "Item",
                    Description = $"Created item [{request.ItemNumber}] - {request.Name} (Channel: {request.SalesChannel}, B2B MOQ: {request.B2bMinQuantity})",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new ItemPayload { Success = true, Message = $"Item [{request.ItemNumber}] created successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ItemPayload { Success = false, Message = $"Failed to register item: {ex.Message}" };
        }
    }

    public async Task<ItemPayload> UpdateItemTransactionAsync(ItemRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string updateSql = @"
                UPDATE dbo.Item
                SET Name = @Name,
                    DisplayName = @DisplayName,
                    Description = @Description,
                    Category = @Category,
                    SalesChannel = @SalesChannel,
                    B2CPrice = @B2CPrice,
                    B2CCompareAtPrice = @B2CCompareAtPrice,
                    B2BPrice = @B2BPrice,
                    B2BMinQuantity = @B2BMinQuantity,
                    UnitOfMeasure = @UnitOfMeasure,
                    Season = @Season,
                    Brand = @Brand,
                    Tags = @Tags,
                    Images = @Images,
                    IsActive = @IsActive
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(ItemNumber) = UPPER(@ItemNumber);";

            await db.ExecuteAsync(new CommandDefinition(
                updateSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    Name = request.Name,
                    DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? request.Name : request.DisplayName,
                    Description = request.Description,
                    Category = request.Category,
                    SalesChannel = request.SalesChannel,
                    B2CPrice = request.B2cPrice,
                    B2CCompareAtPrice = request.B2cCompareAtPrice,
                    B2BPrice = request.B2bPrice,
                    B2BMinQuantity = request.B2bMinQuantity < 1 ? 1 : request.B2bMinQuantity,
                    UnitOfMeasure = string.IsNullOrWhiteSpace(request.UnitOfMeasure) ? "PCS" : request.UnitOfMeasure,
                    Season = request.Season,
                    Brand = request.Brand,
                    Tags = request.Tags,
                    Images = request.Images,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            // Sync variants: Delete existing ones and re-insert, or merge
            if (request.Variants != null)
            {
                const string delVarSql = @"
                    DELETE FROM dbo.ItemVariant
                    WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ItemNumber) = UPPER(@ItemNumber);";

                await db.ExecuteAsync(new CommandDefinition(delVarSql, new { AccountId = request.UserAccountId, CompanyCode = request.CompanyCode.ToUpper(), ItemNumber = request.ItemNumber.ToUpper() }, transaction, cancellationToken: cancellationToken));

                const string insertVarSql = @"
                    INSERT INTO dbo.ItemVariant
                    (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, Sku, Barcode, AdditionalPrice, IsActive, DateCreated)
                    VALUES
                    (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @Sku, @Barcode, @AdditionalPrice, @IsActive, SYSDATETIME());";

                foreach (var v in request.Variants)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertVarSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            ItemNumber = request.ItemNumber.ToUpper(),
                            ColourCode = v.ColourCode.ToUpper(),
                            SizeCode = v.SizeCode.ToUpper(),
                            Sku = v.Sku,
                            Barcode = v.Barcode,
                            AdditionalPrice = v.AdditionalPrice,
                            IsActive = v.IsActive
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            const string auditSql = @"
                INSERT INTO dbo.ItemAuditTrail
                (AccountId, CompanyCode, ItemNumber, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ItemNumber, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    Field = "Item",
                    Description = $"Updated item [{request.ItemNumber}] - Status: {(request.IsActive ? "Active" : "Inactive")}, B2B Price: {request.B2bPrice}, MOQ: {request.B2bMinQuantity}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new ItemPayload { Success = true, Message = $"Item [{request.ItemNumber}] updated successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ItemPayload { Success = false, Message = $"Failed to update item: {ex.Message}" };
        }
    }

    public async Task<ItemPayload> DeleteItemTransactionAsync(string accountId, string companyCode, string itemNumber, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string delAuditSql = @"
                DELETE FROM dbo.ItemAuditTrail
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ItemNumber) = UPPER(@ItemNumber);";

            await db.ExecuteAsync(new CommandDefinition(delAuditSql, new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber }, transaction, cancellationToken: cancellationToken));

            const string delVarSql = @"
                DELETE FROM dbo.ItemVariant
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ItemNumber) = UPPER(@ItemNumber);";

            await db.ExecuteAsync(new CommandDefinition(delVarSql, new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber }, transaction, cancellationToken: cancellationToken));

            const string delItemSql = @"
                DELETE FROM dbo.Item
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(ItemNumber) = UPPER(@ItemNumber);";

            await db.ExecuteAsync(new CommandDefinition(delItemSql, new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new ItemPayload { Success = true, Message = $"Item [{itemNumber}] deleted successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new ItemPayload { Success = false, Message = $"Failed to delete item: {ex.Message}" };
        }
    }
}
