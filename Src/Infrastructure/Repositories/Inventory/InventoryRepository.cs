using Application.Common.Tenant;
using Application.DTOs.Inventory;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Inventory;

public class InventoryRepository(IHttpContextAccessor httpContextAccessor) : IInventoryRepository
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

    public async Task<IEnumerable<InventoryDto>> GetInventoryListAsync(string accountId, string? companyCode = null, string? locationType = null, string? locationCode = null, string? itemNumber = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT inv.Sequence, inv.AccountId, inv.CompanyCode, c.Name AS CompanyName,
                   inv.ItemNumber, itm.Name AS ItemName, itm.DisplayName AS ItemDisplayName,
                   inv.ColourCode, clr.Name AS ColourName, clr.HexCode AS ColourHex,
                   inv.SizeCode, sz.Name AS SizeName,
                   inv.LocationType, inv.LocationCode,
                   COALESCE(wh.Name, st.Name, inv.LocationCode) AS LocationName,
                   inv.QuantityOnHand, inv.AllocatedQuantity, inv.AvailableQuantity, inv.ReorderLevel,
                   inv.DateModified
            FROM dbo.Inventory AS inv
            INNER JOIN dbo.Company AS c ON inv.AccountId = c.AccountId AND inv.CompanyCode = c.Code
            INNER JOIN dbo.Item AS itm ON inv.AccountId = itm.AccountId AND inv.CompanyCode = itm.CompanyCode AND inv.ItemNumber = itm.ItemNumber
            LEFT JOIN dbo.Colour AS clr ON inv.AccountId = clr.AccountId AND inv.CompanyCode = clr.CompanyCode AND inv.ColourCode = clr.Code
            LEFT JOIN dbo.Size AS sz ON inv.AccountId = sz.AccountId AND inv.CompanyCode = sz.CompanyCode AND inv.SizeCode = sz.Code
            LEFT JOIN dbo.Warehouse AS wh ON inv.LocationType = 'Warehouse' AND inv.AccountId = wh.AccountId AND inv.CompanyCode = wh.CompanyCode AND inv.LocationCode = wh.Code
            LEFT JOIN dbo.Store AS st ON inv.LocationType = 'Store' AND inv.AccountId = st.AccountId AND inv.CompanyCode = st.CompanyCode AND inv.LocationCode = st.Code
            WHERE inv.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(inv.CompanyCode) = UPPER(@CompanyCode))
              AND (@LocationType IS NULL OR inv.LocationType = @LocationType)
              AND (@LocationCode IS NULL OR UPPER(inv.LocationCode) = UPPER(@LocationCode))
              AND (@ItemNumber IS NULL OR UPPER(inv.ItemNumber) = UPPER(@ItemNumber))
            ORDER BY inv.CompanyCode ASC, inv.ItemNumber ASC, inv.ColourCode ASC, inv.SizeCode ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, LocationType = locationType, LocationCode = locationCode, ItemNumber = itemNumber },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<InventoryDto>(command);
    }

    public async Task<InventoryDto?> GetInventoryRecordAsync(string accountId, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT inv.Sequence, inv.AccountId, inv.CompanyCode, c.Name AS CompanyName,
                   inv.ItemNumber, itm.Name AS ItemName, itm.DisplayName AS ItemDisplayName,
                   inv.ColourCode, clr.Name AS ColourName, clr.HexCode AS ColourHex,
                   inv.SizeCode, sz.Name AS SizeName,
                   inv.LocationType, inv.LocationCode,
                   COALESCE(wh.Name, st.Name, inv.LocationCode) AS LocationName,
                   inv.QuantityOnHand, inv.AllocatedQuantity, inv.AvailableQuantity, inv.ReorderLevel,
                   inv.DateModified
            FROM dbo.Inventory AS inv
            INNER JOIN dbo.Company AS c ON inv.AccountId = c.AccountId AND inv.CompanyCode = c.Code
            INNER JOIN dbo.Item AS itm ON inv.AccountId = itm.AccountId AND inv.CompanyCode = itm.CompanyCode AND inv.ItemNumber = itm.ItemNumber
            LEFT JOIN dbo.Colour AS clr ON inv.AccountId = clr.AccountId AND inv.CompanyCode = clr.CompanyCode AND inv.ColourCode = clr.Code
            LEFT JOIN dbo.Size AS sz ON inv.AccountId = sz.AccountId AND inv.CompanyCode = sz.CompanyCode AND inv.SizeCode = sz.Code
            LEFT JOIN dbo.Warehouse AS wh ON inv.LocationType = 'Warehouse' AND inv.AccountId = wh.AccountId AND inv.CompanyCode = wh.CompanyCode AND inv.LocationCode = wh.Code
            LEFT JOIN dbo.Store AS st ON inv.LocationType = 'Store' AND inv.AccountId = st.AccountId AND inv.CompanyCode = st.CompanyCode AND inv.LocationCode = st.Code
            WHERE inv.AccountId = @AccountId
              AND UPPER(inv.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(inv.ItemNumber) = UPPER(@ItemNumber)
              AND UPPER(inv.ColourCode) = UPPER(@ColourCode)
              AND UPPER(inv.SizeCode) = UPPER(@SizeCode)
              AND UPPER(inv.LocationType) = UPPER(@LocationType)
              AND UPPER(inv.LocationCode) = UPPER(@LocationCode)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber, ColourCode = colourCode, SizeCode = sizeCode, LocationType = locationType, LocationCode = locationCode },
            cancellationToken: cancellationToken);

        return await db.QueryFirstOrDefaultAsync<InventoryDto>(command);
    }

    public async Task<IEnumerable<InventoryAuditTrailDto>> GetInventoryAuditDetailsAsync(string accountId, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode,
                   LocationType, LocationCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.InventoryAuditTrail
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(ItemNumber) = UPPER(@ItemNumber)
              AND UPPER(ColourCode) = UPPER(@ColourCode)
              AND UPPER(SizeCode) = UPPER(@SizeCode)
              AND UPPER(LocationType) = UPPER(@LocationType)
              AND UPPER(LocationCode) = UPPER(@LocationCode)
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, ItemNumber = itemNumber, ColourCode = colourCode, SizeCode = sizeCode, LocationType = locationType, LocationCode = locationCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<InventoryAuditTrailDto>(command);
    }

    public async Task<InventoryPayload> UpsertInventoryTransactionAsync(InventoryRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            // First check if variant exists; if not, create it on the fly so inventory can always be tracked
            const string checkVarSql = @"
                SELECT COUNT(1) FROM dbo.ItemVariant
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(ItemNumber) = UPPER(@ItemNumber) AND UPPER(ColourCode) = UPPER(@ColourCode) AND UPPER(SizeCode) = UPPER(@SizeCode)";

            var varCount = await db.ExecuteScalarAsync<int>(new CommandDefinition(checkVarSql, new
            {
                AccountId = request.UserAccountId,
                CompanyCode = request.CompanyCode,
                ItemNumber = request.ItemNumber,
                ColourCode = request.ColourCode,
                SizeCode = request.SizeCode
            }, transaction, cancellationToken: cancellationToken));

            if (varCount == 0)
            {
                const string insertVarSql = @"
                    INSERT INTO dbo.ItemVariant
                    (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, Sku, AdditionalPrice, IsActive, DateCreated)
                    VALUES
                    (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @Sku, 0, 1, SYSDATETIME());";

                await db.ExecuteAsync(new CommandDefinition(insertVarSql, new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    ColourCode = request.ColourCode.ToUpper(),
                    SizeCode = request.SizeCode.ToUpper(),
                    Sku = $"{request.ItemNumber}-{request.ColourCode}-{request.SizeCode}".ToUpper()
                }, transaction, cancellationToken: cancellationToken));
            }

            const string upsertSql = @"
                IF EXISTS (
                    SELECT 1 FROM dbo.Inventory
                    WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                      AND UPPER(ItemNumber) = UPPER(@ItemNumber) AND UPPER(ColourCode) = UPPER(@ColourCode)
                      AND UPPER(SizeCode) = UPPER(@SizeCode) AND LocationType = @LocationType AND UPPER(LocationCode) = UPPER(@LocationCode)
                )
                BEGIN
                    UPDATE dbo.Inventory
                    SET QuantityOnHand = @QuantityOnHand,
                        AllocatedQuantity = @AllocatedQuantity,
                        ReorderLevel = @ReorderLevel,
                        DateModified = SYSDATETIME()
                    WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                      AND UPPER(ItemNumber) = UPPER(@ItemNumber) AND UPPER(ColourCode) = UPPER(@ColourCode)
                      AND UPPER(SizeCode) = UPPER(@SizeCode) AND LocationType = @LocationType AND UPPER(LocationCode) = UPPER(@LocationCode);
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.Inventory
                    (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, LocationType, LocationCode, QuantityOnHand, AllocatedQuantity, ReorderLevel, DateModified)
                    VALUES
                    (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @LocationType, @LocationCode, @QuantityOnHand, @AllocatedQuantity, @ReorderLevel, SYSDATETIME());
                END";

            await db.ExecuteAsync(new CommandDefinition(
                upsertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    ColourCode = request.ColourCode.ToUpper(),
                    SizeCode = request.SizeCode.ToUpper(),
                    LocationType = request.LocationType,
                    LocationCode = request.LocationCode.ToUpper(),
                    QuantityOnHand = request.QuantityOnHand,
                    AllocatedQuantity = request.AllocatedQuantity,
                    ReorderLevel = request.ReorderLevel
                },
                transaction,
                cancellationToken: cancellationToken));

            const string auditSql = @"
                INSERT INTO dbo.InventoryAuditTrail
                (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, LocationType, LocationCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @LocationType, @LocationCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    ItemNumber = request.ItemNumber.ToUpper(),
                    ColourCode = request.ColourCode.ToUpper(),
                    SizeCode = request.SizeCode.ToUpper(),
                    LocationType = request.LocationType,
                    LocationCode = request.LocationCode.ToUpper(),
                    Field = "Stock Level",
                    Description = $"Updated stock in {request.LocationType} [{request.LocationCode}]: On Hand = {request.QuantityOnHand}, Allocated = {request.AllocatedQuantity}. Reason: {request.Reason ?? "Manual Update"}",
                    ModifiedBy = request.UserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new InventoryPayload { Success = true, Message = "Inventory updated successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new InventoryPayload { Success = false, Message = $"Failed to update inventory: {ex.Message}" };
        }
    }

    public async Task<InventoryPayload> AdjustInventoryTransactionAsync(string accountId, string userName, string companyCode, string itemNumber, string colourCode, string sizeCode, string locationType, string locationCode, int adjustment, string? reason, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string adjustSql = @"
                UPDATE dbo.Inventory
                SET QuantityOnHand = QuantityOnHand + @Adjustment,
                    DateModified = SYSDATETIME()
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(ItemNumber) = UPPER(@ItemNumber) AND UPPER(ColourCode) = UPPER(@ColourCode)
                  AND UPPER(SizeCode) = UPPER(@SizeCode) AND LocationType = @LocationType AND UPPER(LocationCode) = UPPER(@LocationCode);";

            var rows = await db.ExecuteAsync(new CommandDefinition(
                adjustSql,
                new
                {
                    AccountId = accountId,
                    CompanyCode = companyCode.ToUpper(),
                    ItemNumber = itemNumber.ToUpper(),
                    ColourCode = colourCode.ToUpper(),
                    SizeCode = sizeCode.ToUpper(),
                    LocationType = locationType,
                    LocationCode = locationCode.ToUpper(),
                    Adjustment = adjustment
                },
                transaction,
                cancellationToken: cancellationToken));

            if (rows == 0)
            {
                // Record doesn't exist yet, insert with initial stock = adjustment
                const string insertSql = @"
                    INSERT INTO dbo.Inventory
                    (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, LocationType, LocationCode, QuantityOnHand, AllocatedQuantity, ReorderLevel, DateModified)
                    VALUES
                    (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @LocationType, @LocationCode, @QuantityOnHand, 0, 0, SYSDATETIME());";

                await db.ExecuteAsync(new CommandDefinition(
                    insertSql,
                    new
                    {
                        AccountId = accountId,
                        CompanyCode = companyCode.ToUpper(),
                        ItemNumber = itemNumber.ToUpper(),
                        ColourCode = colourCode.ToUpper(),
                        SizeCode = sizeCode.ToUpper(),
                        LocationType = locationType,
                        LocationCode = locationCode.ToUpper(),
                        QuantityOnHand = Math.Max(0, adjustment)
                    },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            const string auditSql = @"
                INSERT INTO dbo.InventoryAuditTrail
                (AccountId, CompanyCode, ItemNumber, ColourCode, SizeCode, LocationType, LocationCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @ItemNumber, @ColourCode, @SizeCode, @LocationType, @LocationCode, @Field, @Description, SYSDATETIME(), @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                auditSql,
                new
                {
                    AccountId = accountId,
                    CompanyCode = companyCode.ToUpper(),
                    ItemNumber = itemNumber.ToUpper(),
                    ColourCode = colourCode.ToUpper(),
                    SizeCode = sizeCode.ToUpper(),
                    LocationType = locationType,
                    LocationCode = locationCode.ToUpper(),
                    Field = "Stock Adjustment",
                    Description = $"Stock adjusted by {adjustment:+0;-0;0} in {locationType} [{locationCode}]. Reason: {reason ?? "Adjustment"}",
                    ModifiedBy = userName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new InventoryPayload { Success = true, Message = $"Inventory adjusted successfully by {adjustment}." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new InventoryPayload { Success = false, Message = $"Failed to adjust inventory: {ex.Message}" };
        }
    }
}
