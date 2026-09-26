using Application.Common.Tenant;
using Application.DTOs.Masters.Store;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class StoreRepository(IHttpContextAccessor httpContextAccessor) : IStoreRepository
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

    public async Task<IEnumerable<StoreDto>> GetAllStoresAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT s.Sequence, s.AccountId, s.CompanyCode, c.Name AS CompanyName, s.Code, s.Name,
                   s.DisplayName, s.StoreType, s.AddressLine1 AS AddressLineOne, s.AddressLine2 AS AddressLineTwo,
                   s.City, s.StateCode, s.CountryCode, s.PostalCode, s.Contact, s.Email, s.Website,
                   s.Logo, s.CurrencyCode, s.TimeZone, s.IsTestStore, s.OriginalIsTestStore,
                   s.IsActive, s.OriginalIsActive, s.DateCreated
            FROM dbo.Store AS s
            INNER JOIN dbo.Company AS c ON s.AccountId = c.AccountId AND s.CompanyCode = c.Code
            WHERE s.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(s.CompanyCode) = UPPER(@CompanyCode))
            ORDER BY s.CompanyCode ASC, s.Code ASC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<StoreDto>(command);
    }

    public async Task<IEnumerable<StoreAuditTrailDto>> GetAllStoresAuditDetailsAsync(string accountId, string? companyCode = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, StoreCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.StoreAuditTrail
            WHERE AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(CompanyCode) = UPPER(@CompanyCode))
            ORDER BY DateModified DESC, Sequence DESC";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode },
            cancellationToken: cancellationToken);

        return await db.QueryAsync<StoreAuditTrailDto>(command);
    }

    public async Task<StoreDto?> GetStoreByCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string getStoreSql = @"
            SELECT s.Sequence, s.AccountId, s.CompanyCode, c.Name AS CompanyName, s.Code, s.Name,
                   s.DisplayName, s.StoreType, s.AddressLine1 AS AddressLineOne, s.AddressLine2 AS AddressLineTwo,
                   s.City, s.StateCode, s.CountryCode, s.PostalCode, s.Contact, s.Email, s.Website,
                   s.Logo, s.CurrencyCode, s.TimeZone, s.IsTestStore, s.OriginalIsTestStore,
                   s.IsActive, s.OriginalIsActive, s.DateCreated
            FROM dbo.Store AS s
            INNER JOIN dbo.Company AS c ON s.AccountId = c.AccountId AND s.CompanyCode = c.Code
            WHERE s.AccountId = @AccountId
              AND UPPER(s.CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(s.Code) = UPPER(@Code)";

        var storeCmd = new CommandDefinition(
            getStoreSql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = storeCode },
            cancellationToken: cancellationToken);

        var store = await db.QueryFirstOrDefaultAsync<StoreDto>(storeCmd);
        if (store == null)
            return null;

        const string getAuditSql = @"
            SELECT Sequence, AccountId, CompanyCode, StoreCode, Field, Description, DateModified, ModifiedBy
            FROM dbo.StoreAuditTrail
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(StoreCode) = UPPER(@Code)
            ORDER BY DateModified DESC, Sequence DESC";

        var auditCmd = new CommandDefinition(
            getAuditSql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = storeCode },
            cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<StoreAuditTrailDto>(auditCmd)).ToList();
        store.Audit = auditTrail;

        return store;
    }

    public async Task<bool> ExistsByStoreCodeAsync(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT COUNT(1)
            FROM dbo.Store
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(Code) = UPPER(@Code)";

        var command = new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Code = storeCode },
            cancellationToken: cancellationToken);

        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<StorePayload> RegisterStoreTransactionAsync(
        string userAccountId,
        string userName,
        string companyCode,
        string storeCode,
        string storeName,
        string storeDisplayName,
        string storeType,
        string addressLineOne,
        string? addressLineTwo,
        string city,
        string stateCode,
        string countryCode,
        string postalCode,
        string contact,
        string email,
        string? website,
        string? logo,
        string currencyCode,
        string timeZone,
        bool isTestStore,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var creationTime = DateTime.Now;

            // Fetch company status to determine active & sandbox constraints
            const string getCompanyStatusSql = @"
                SELECT IsActive, IsTestCompany
                FROM dbo.Company
                WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code)";

            var companyStatus = await db.QueryFirstOrDefaultAsync<(bool IsActive, bool IsTestCompany)?>(
                new CommandDefinition(getCompanyStatusSql, new { AccountId = userAccountId, Code = companyCode }, transaction, cancellationToken: cancellationToken));

            if (companyStatus == null)
            {
                return new StorePayload
                {
                    Success = false,
                    Message = $"Parent Company [{companyCode}] was not found."
                };
            }

            // Effective state computation:
            // Store's Original state records the user's intent.
            // Effective state is forced inactive if company is inactive; forced sandbox if company is test.
            bool originalIsActive = isActive;
            bool effectiveIsActive = companyStatus.Value.IsActive ? isActive : false;

            bool originalIsTestStore = isTestStore;
            bool effectiveIsTestStore = companyStatus.Value.IsTestCompany ? true : isTestStore;

            const string insertStoreSql = @"
                INSERT INTO dbo.Store
                (AccountId, CompanyCode, Code, Name, DisplayName, StoreType, AddressLine1, AddressLine2, City, StateCode, CountryCode, PostalCode, Contact, Email, Website, Logo, CurrencyCode, TimeZone, IsTestStore, OriginalIsTestStore, IsActive, OriginalIsActive, DateCreated)
                VALUES
                (@AccountId, @CompanyCode, @Code, @Name, @DisplayName, @StoreType, @AddressLine1, @AddressLine2, @City, @StateCode, @CountryCode, @PostalCode, @Contact, @Email, @Website, @Logo, @CurrencyCode, @TimeZone, @IsTestStore, @OriginalIsTestStore, @IsActive, @OriginalIsActive, @DateCreated);";

            await db.ExecuteAsync(new CommandDefinition(
                insertStoreSql,
                new
                {
                    AccountId = userAccountId,
                    CompanyCode = companyCode,
                    Code = storeCode,
                    Name = storeName,
                    DisplayName = storeDisplayName,
                    StoreType = storeType,
                    AddressLine1 = addressLineOne,
                    AddressLine2 = addressLineTwo,
                    City = city,
                    StateCode = stateCode,
                    CountryCode = countryCode,
                    PostalCode = postalCode,
                    Contact = contact,
                    Email = email,
                    Website = website,
                    Logo = logo,
                    CurrencyCode = currencyCode,
                    TimeZone = timeZone,
                    IsTestStore = effectiveIsTestStore,
                    OriginalIsTestStore = originalIsTestStore,
                    IsActive = effectiveIsActive,
                    OriginalIsActive = originalIsActive,
                    DateCreated = creationTime
                },
                transaction,
                cancellationToken: cancellationToken));

            const string insertAuditSql = @"
                INSERT INTO dbo.StoreAuditTrail
                (AccountId, CompanyCode, StoreCode, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@AccountId, @CompanyCode, @StoreCode, @Field, @Description, @DateModified, @ModifiedBy);";

            var auditDesc = $"Created new Store [{storeCode} - {storeName}] under Company [{companyCode}].";
            if (!companyStatus.Value.IsActive)
            {
                auditDesc += " (Notice: Created in Inactive state because parent Company is Inactive).";
            }

            await db.ExecuteAsync(new CommandDefinition(
                insertAuditSql,
                new
                {
                    AccountId = userAccountId,
                    CompanyCode = companyCode,
                    StoreCode = storeCode,
                    Field = "All",
                    Description = auditDesc,
                    DateModified = creationTime,
                    ModifiedBy = userName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return await FetchStoreDetails(userAccountId, companyCode, storeCode, cancellationToken);
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new StorePayload
            {
                Success = false,
                Message = $"Error while creating store {storeName}: {ex.Message}"
            };
        }
    }

    public async Task<StorePayload> UpdateStoreTransactionAsync(
        string userAccountId,
        string userName,
        string companyCode,
        string storeCode,
        string storeName,
        string storeDisplayName,
        string storeType,
        string addressLineOne,
        string? addressLineTwo,
        string city,
        string stateCode,
        string countryCode,
        string postalCode,
        string contact,
        string email,
        string? website,
        string? logo,
        string currencyCode,
        string timeZone,
        bool isTestStore,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var modificationTime = DateTime.Now;

            var current = await FetchStoreDetails(userAccountId, companyCode, storeCode, cancellationToken);
            if (!current.Success || current.StoreDetails is null)
            {
                return new StorePayload
                {
                    Success = false,
                    Message = $"Store [{storeCode}] under Company [{companyCode}] could not be found."
                };
            }

            var store = current.StoreDetails;

            // Fetch company status
            const string getCompanyStatusSql = @"
                SELECT IsActive, IsTestCompany
                FROM dbo.Company
                WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code)";

            var companyStatus = await db.QueryFirstOrDefaultAsync<(bool IsActive, bool IsTestCompany)?>(
                new CommandDefinition(getCompanyStatusSql, new { AccountId = userAccountId, Code = companyCode }, transaction, cancellationToken: cancellationToken));

            bool isCompanyActive = companyStatus?.IsActive ?? true;
            bool isCompanyTest = companyStatus?.IsTestCompany ?? false;

            bool originalIsActive = isActive;
            bool effectiveIsActive = isCompanyActive ? isActive : false;

            bool originalIsTestStore = isTestStore;
            bool effectiveIsTestStore = isCompanyTest ? true : isTestStore;

            var changes = new Dictionary<string, (string? OldValue, string? NewValue)>();

            void AddChange(string field, string? oldValue, string? newValue)
            {
                if (!string.Equals(oldValue, newValue, StringComparison.OrdinalIgnoreCase))
                    changes[field] = (oldValue, newValue);
            }

            AddChange(nameof(store.Name), store.Name, storeName);
            AddChange(nameof(store.DisplayName), store.DisplayName, storeDisplayName);
            AddChange(nameof(store.StoreType), store.StoreType, storeType);
            AddChange(nameof(store.AddressLineOne), store.AddressLineOne, addressLineOne);
            AddChange(nameof(store.AddressLineTwo), store.AddressLineTwo, addressLineTwo);
            AddChange(nameof(store.City), store.City, city);
            AddChange(nameof(store.StateCode), store.StateCode, stateCode);
            AddChange(nameof(store.CountryCode), store.CountryCode, countryCode);
            AddChange(nameof(store.PostalCode), store.PostalCode, postalCode);
            AddChange(nameof(store.Contact), store.Contact, contact);
            AddChange(nameof(store.Email), store.Email, email);
            AddChange(nameof(store.Website), store.Website, website);
            AddChange(nameof(store.Logo), store.Logo, logo);
            AddChange(nameof(store.CurrencyCode), store.CurrencyCode, currencyCode);
            AddChange(nameof(store.TimeZone), store.TimeZone, timeZone);
            AddChange(nameof(store.IsTestStore), store.IsTestStore.ToString(), effectiveIsTestStore.ToString());
            AddChange(nameof(store.IsActive), store.IsActive.ToString(), effectiveIsActive.ToString());

            if (changes.Count > 0)
            {
                var field = string.Join(",", changes.Keys);
                var description = string.Join(
                    Environment.NewLine,
                    changes.Select(x => $"- [{x.Key}] changed from '{FormatAuditValue(x.Key, x.Value.OldValue)}' to '{FormatAuditValue(x.Key, x.Value.NewValue)}'"));

                if (description.Length > 1000) description = description[..997] + "...";
                if (field.Length > 200) field = field[..197] + "...";

                const string auditSql = @"
                    INSERT INTO dbo.StoreAuditTrail
                    (AccountId, CompanyCode, StoreCode, Field, Description, DateModified, ModifiedBy)
                    VALUES
                    (@AccountId, @CompanyCode, @StoreCode, @Field, @Description, @DateModified, @ModifiedBy);";

                await db.ExecuteAsync(new CommandDefinition(
                    auditSql,
                    new
                    {
                        AccountId = userAccountId,
                        CompanyCode = companyCode,
                        StoreCode = storeCode,
                        Field = field,
                        Description = description,
                        DateModified = modificationTime,
                        ModifiedBy = userName
                    },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            const string updateSql = @"
                UPDATE dbo.Store
                SET
                    Name = @Name,
                    DisplayName = @DisplayName,
                    StoreType = @StoreType,
                    AddressLine1 = @AddressLine1,
                    AddressLine2 = @AddressLine2,
                    City = @City,
                    StateCode = @StateCode,
                    CountryCode = @CountryCode,
                    PostalCode = @PostalCode,
                    Contact = @Contact,
                    Email = @Email,
                    Website = @Website,
                    Logo = @Logo,
                    CurrencyCode = @CurrencyCode,
                    TimeZone = @TimeZone,
                    IsTestStore = @IsTestStore,
                    OriginalIsTestStore = @OriginalIsTestStore,
                    IsActive = @IsActive,
                    OriginalIsActive = @OriginalIsActive
                WHERE AccountId = @AccountId
                  AND CompanyCode = @CompanyCode
                  AND Code = @Code;";

            await db.ExecuteAsync(new CommandDefinition(
                updateSql,
                new
                {
                    AccountId = userAccountId,
                    CompanyCode = companyCode,
                    Code = storeCode,
                    Name = storeName,
                    DisplayName = storeDisplayName,
                    StoreType = storeType,
                    AddressLine1 = addressLineOne,
                    AddressLine2 = addressLineTwo,
                    City = city,
                    StateCode = stateCode,
                    CountryCode = countryCode,
                    PostalCode = postalCode,
                    Contact = contact,
                    Email = email,
                    Website = website,
                    Logo = logo,
                    CurrencyCode = currencyCode,
                    TimeZone = timeZone,
                    IsTestStore = effectiveIsTestStore,
                    OriginalIsTestStore = originalIsTestStore,
                    IsActive = effectiveIsActive,
                    OriginalIsActive = originalIsActive
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            var result = await FetchStoreDetails(userAccountId, companyCode, storeCode, cancellationToken);

            return new StorePayload
            {
                Success = result.Success,
                Message = $"Store [{storeCode}] was updated successfully.",
                StoreDetails = result.StoreDetails
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new StorePayload
            {
                Success = false,
                Message = $"Error while updating store {storeName}: {ex.Message}"
            };
        }
    }

    public async Task<StorePayload> DeleteStoreTransactionAsync(string userAccountId, string companyCode, string storeCode, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            const string deleteSql = @"
                DELETE FROM dbo.StoreAuditTrail
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(StoreCode) = UPPER(@StoreCode);

                DELETE FROM dbo.Store
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(Code) = UPPER(@StoreCode);";

            await db.ExecuteAsync(new CommandDefinition(
                deleteSql,
                new
                {
                    AccountId = userAccountId,
                    CompanyCode = companyCode,
                    StoreCode = storeCode
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new StorePayload
            {
                Success = true,
                Message = $"Store [{storeCode}] was deleted successfully."
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new StorePayload
            {
                Success = false,
                Message = $"Error while deleting store [{storeCode}]: {ex.Message}"
            };
        }
    }

    private async Task<StorePayload> FetchStoreDetails(string accountId, string companyCode, string storeCode, CancellationToken cancellationToken)
    {
        var store = await GetStoreByCodeAsync(accountId, companyCode, storeCode, cancellationToken);
        if (store == null)
        {
            return new StorePayload
            {
                Success = false,
                Message = $"Store [{storeCode}] under Company [{companyCode}] could not be found."
            };
        }

        return new StorePayload
        {
            Success = true,
            Message = "Operation completed successfully.",
            StoreDetails = store
        };
    }

    private static string FormatAuditValue(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "(empty)";

        if (field.Equals(nameof(StoreDto.Logo), StringComparison.OrdinalIgnoreCase))
        {
            if (value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                return "[image data]";
            if (value.Length > 80)
                return $"{value[..77]}...";
        }

        if (value.Length > 100)
            return $"{value[..97]}...";

        return value;
    }
}
