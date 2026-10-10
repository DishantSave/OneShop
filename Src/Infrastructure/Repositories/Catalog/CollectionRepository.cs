using Application.Common.Tenant;
using Application.DTOs.Catalog.Collection;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Catalog;

public class CollectionRepository(IHttpContextAccessor httpContextAccessor) : ICollectionRepository
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

    public async Task<IEnumerable<CollectionDto>> GetAllCollectionsAsync(string accountId, string? companyCode = null, string? channel = null, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT col.Sequence, col.AccountId, col.CompanyCode, c.Name AS CompanyName, col.Code, col.Name,
                   col.Description, col.Season, col.Channel, col.BannerImage, col.IsActive, col.DateCreated
            FROM dbo.Collection AS col
            INNER JOIN dbo.Company AS c ON col.AccountId = c.AccountId AND col.CompanyCode = c.Code
            WHERE (@IsCustomer = 0 AND col.AccountId = @AccountId OR @IsCustomer = 1 AND col.IsActive = 1)
              AND (@CompanyCode IS NULL OR UPPER(col.CompanyCode) = UPPER(@CompanyCode))
              AND (@Channel IS NULL OR col.Channel = @Channel OR col.Channel = 'Both')
            ORDER BY col.CompanyCode ASC, col.Code ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Channel = channel, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<CollectionDto>(command);
    }

    public async Task<CollectionDto?> GetCollectionByCodeAsync(string accountId, string companyCode, string code, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT col.Sequence, col.AccountId, col.CompanyCode, c.Name AS CompanyName, col.Code, col.Name,
                   col.Description, col.Season, col.Channel, col.BannerImage, col.IsActive, col.DateCreated
            FROM dbo.Collection AS col
            INNER JOIN dbo.Company AS c ON col.AccountId = c.AccountId AND col.CompanyCode = c.Code
            WHERE (@IsCustomer = 0 AND col.AccountId = @AccountId OR @IsCustomer = 1)
              AND UPPER(col.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(col.Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken);

        return await db.QueryFirstOrDefaultAsync<CollectionDto>(command);
    }

    public async Task<IEnumerable<CollectionItemDto>> GetCollectionItemsAsync(string accountId, string companyCode, string collectionCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT ci.Sequence, ci.AccountId, ci.CompanyCode, ci.CollectionCode, ci.ItemNumber, ci.SizeCode,
                   s.Name AS SizeName,
                   i.Name AS ItemName, i.DisplayName AS ItemDisplayName, i.Category, i.SalesChannel,
                   i.B2CPrice, i.B2BPrice, i.B2BMinQuantity, ci.SortOrder, ci.DateAdded
            FROM dbo.CollectionItem AS ci
            INNER JOIN dbo.Item AS i ON ci.AccountId = i.AccountId AND ci.CompanyCode = i.CompanyCode AND ci.ItemNumber = i.ItemNumber
            LEFT JOIN dbo.Size AS s ON ci.AccountId = s.AccountId AND ci.CompanyCode = s.CompanyCode AND ci.SizeCode = s.Code
            WHERE ci.AccountId = @AccountId
              AND UPPER(ci.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(ci.CollectionCode) = UPPER(@CollectionCode)
            ORDER BY ci.SortOrder ASC, ci.ItemNumber ASC, ci.SizeCode ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, CollectionCode = collectionCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<CollectionItemDto>(command);
    }

    public async Task<bool> ExistsByCollectionCodeAsync(string accountId, string companyCode, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Collection
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = code },
            cancellationToken: cancellationToken);

        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<CollectionPayload> RegisterCollectionTransactionAsync(CollectionRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string insertSql = @"
                INSERT INTO dbo.Collection
                (AccountId, CompanyCode, Code, Name, Description, Season, Channel, BannerImage, IsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @Code, @Name, @Description, @Season, @Channel, @BannerImage, @IsActive, SYSDATETIME());";

            await db.ExecuteAsync(new CommandDefinition(
                insertSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    Description = request.Description,
                    Season = request.Season,
                    Channel = request.Channel,
                    BannerImage = request.BannerImage,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            if (request.Items is { Count: > 0 })
            {
                const string insertItemSql = @"
                    INSERT INTO dbo.CollectionItem
                    (AccountId, CompanyCode, CollectionCode, ItemNumber, SizeCode, SortOrder, DateAdded)
                    VALUES
                    (@AccountId, @CompanyCode, @CollectionCode, @ItemNumber, @SizeCode, @SortOrder, SYSDATETIME());";

                int order = 1;
                foreach (var itm in request.Items)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertItemSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            CollectionCode = request.Code.ToUpper(),
                            ItemNumber = itm.ItemNumber.ToUpper(),
                            SizeCode = string.IsNullOrWhiteSpace(itm.SizeCode) ? "ALL" : itm.SizeCode.ToUpper(),
                            SortOrder = itm.SortOrder > 0 ? itm.SortOrder : order++
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }
            else if (request.ItemNumbers is { Count: > 0 })
            {
                const string insertItemSql = @"
                    INSERT INTO dbo.CollectionItem
                    (AccountId, CompanyCode, CollectionCode, ItemNumber, SizeCode, SortOrder, DateAdded)
                    VALUES
                    (@AccountId, @CompanyCode, @CollectionCode, @ItemNumber, @SizeCode, @SortOrder, SYSDATETIME());";

                int order = 1;
                foreach (var itm in request.ItemNumbers)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertItemSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            CollectionCode = request.Code.ToUpper(),
                            ItemNumber = itm.ToUpper(),
                            SizeCode = "ALL",
                            SortOrder = order++
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            transaction.Commit();

            return new CollectionPayload { Success = true, Message = $"Collection [{request.Code}] created successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CollectionPayload { Success = false, Message = $"Failed to register collection: {ex.Message}" };
        }
    }

    public async Task<CollectionPayload> UpdateCollectionTransactionAsync(CollectionRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string updateSql = @"
                UPDATE dbo.Collection
                SET Name = @Name,
                    Description = @Description,
                    Season = @Season,
                    Channel = @Channel,
                    BannerImage = @BannerImage,
                    IsActive = @IsActive
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(
                updateSql,
                new
                {
                    AccountId = request.UserAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    Code = request.Code.ToUpper(),
                    Name = request.Name,
                    Description = request.Description,
                    Season = request.Season,
                    Channel = request.Channel,
                    BannerImage = request.BannerImage,
                    IsActive = request.IsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            if (request.Items != null)
            {
                const string delItemsSql = @"
                    DELETE FROM dbo.CollectionItem
                    WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(CollectionCode) = UPPER(@Code);";

                await db.ExecuteAsync(new CommandDefinition(delItemsSql, new { AccountId = request.UserAccountId, CompanyCode = request.CompanyCode.ToUpper(), Code = request.Code.ToUpper() }, transaction, cancellationToken: cancellationToken));

                const string insertItemSql = @"
                    INSERT INTO dbo.CollectionItem
                    (AccountId, CompanyCode, CollectionCode, ItemNumber, SizeCode, SortOrder, DateAdded)
                    VALUES
                    (@AccountId, @CompanyCode, @CollectionCode, @ItemNumber, @SizeCode, @SortOrder, SYSDATETIME());";

                int order = 1;
                foreach (var itm in request.Items)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertItemSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            CollectionCode = request.Code.ToUpper(),
                            ItemNumber = itm.ItemNumber.ToUpper(),
                            SizeCode = string.IsNullOrWhiteSpace(itm.SizeCode) ? "ALL" : itm.SizeCode.ToUpper(),
                            SortOrder = itm.SortOrder > 0 ? itm.SortOrder : order++
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }
            else if (request.ItemNumbers != null)
            {
                const string delItemsSql = @"
                    DELETE FROM dbo.CollectionItem
                    WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(CollectionCode) = UPPER(@Code);";

                await db.ExecuteAsync(new CommandDefinition(delItemsSql, new { AccountId = request.UserAccountId, CompanyCode = request.CompanyCode.ToUpper(), Code = request.Code.ToUpper() }, transaction, cancellationToken: cancellationToken));

                const string insertItemSql = @"
                    INSERT INTO dbo.CollectionItem
                    (AccountId, CompanyCode, CollectionCode, ItemNumber, SizeCode, SortOrder, DateAdded)
                    VALUES
                    (@AccountId, @CompanyCode, @CollectionCode, @ItemNumber, @SizeCode, @SortOrder, SYSDATETIME());";

                int order = 1;
                foreach (var itm in request.ItemNumbers)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertItemSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            CompanyCode = request.CompanyCode.ToUpper(),
                            CollectionCode = request.Code.ToUpper(),
                            ItemNumber = itm.ToUpper(),
                            SizeCode = "ALL",
                            SortOrder = order++
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            transaction.Commit();

            return new CollectionPayload { Success = true, Message = $"Collection [{request.Code}] updated successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CollectionPayload { Success = false, Message = $"Failed to update collection: {ex.Message}" };
        }
    }

    public async Task<CollectionPayload> DeleteCollectionTransactionAsync(string accountId, string companyCode, string code, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string delItemsSql = @"
                DELETE FROM dbo.CollectionItem
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(CollectionCode) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delItemsSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            const string delColSql = @"
                DELETE FROM dbo.Collection
                WHERE AccountId = @AccountId AND UPPER(CompanyCode) = UPPER(@CompanyCode) AND UPPER(Code) = UPPER(@Code);";

            await db.ExecuteAsync(new CommandDefinition(delColSql, new { AccountId = accountId, CompanyCode = companyCode, Code = code }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new CollectionPayload { Success = true, Message = $"Collection [{code}] deleted successfully." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CollectionPayload { Success = false, Message = $"Failed to delete collection: {ex.Message}" };
        }
    }
}
