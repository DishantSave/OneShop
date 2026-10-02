using Application.Common.Tenant;
using Application.DTOs.Users;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories;

public class SubAccountRepository(IHttpContextAccessor httpContextAccessor) : ISubAccountRepository
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

    public async Task<bool> IsMainAccountHolderAsync(string accountId, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = "SELECT COUNT(1) FROM dbo.AccountCredential WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";
        var count = await db.ExecuteScalarAsync<int>(new CommandDefinition(sql, new { AccountId = accountId, UserName = userName }, cancellationToken: cancellationToken));
        return count > 0;
    }

    public async Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = "SELECT COUNT(1) FROM dbo.Users WHERE UPPER(UserName) = UPPER(@UserName);";
        var count = await db.ExecuteScalarAsync<int>(new CommandDefinition(sql, new { UserName = userName }, cancellationToken: cancellationToken));
        return count > 0;
    }

    public async Task<IEnumerable<SubAccountDto>> GetAllSubAccountsAsync(string accountId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string sql = @"
            SELECT sa.Sequence, sa.UserName, sa.AccountId, sa.SubUserId, sa.Designation, sa.Department,
                   sa.IsCustomerAccount, sa.IsSellerAccount, sa.Company, sa.ProfilePicture,
                   sa.Email, sa.Contact, sa.Country, sa.IsTestAccount, sa.IsActive,
                   sa.DateCreated, sa.DateModified
            FROM dbo.SubAccountCredential AS sa
            WHERE sa.AccountId = @AccountId
            ORDER BY sa.DateCreated DESC;";

        var subAccounts = (await db.QueryAsync<SubAccountDto>(new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: cancellationToken))).ToList();

        if (subAccounts.Count == 0)
            return subAccounts;

        const string permissionsSql = @"
            SELECT SubUserId, ScreenName, CanView, CanCreate, CanEdit, CanDelete
            FROM dbo.SubAccountScreenAccess
            WHERE AccountId = @AccountId;";

        var allPermissions = await db.QueryAsync<(string SubUserId, string ScreenName, bool CanView, bool CanCreate, bool CanEdit, bool CanDelete)>(
            new CommandDefinition(permissionsSql, new { AccountId = accountId }, cancellationToken: cancellationToken));

        var permLookup = allPermissions.ToLookup(p => p.SubUserId);

        foreach (var sub in subAccounts)
        {
            sub.ScreenAccess = permLookup[sub.SubUserId].Select(p => new SubAccountScreenAccessDto
            {
                ScreenName = p.ScreenName,
                CanView = p.CanView,
                CanCreate = p.CanCreate,
                CanEdit = p.CanEdit,
                CanDelete = p.CanDelete
            }).ToList();
        }

        return subAccounts;
    }

    public async Task<SubAccountDto?> GetSubAccountByUserNameAsync(string accountId, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string sql = @"
            SELECT sa.Sequence, sa.UserName, sa.AccountId, sa.SubUserId, sa.Designation, sa.Department,
                   sa.IsCustomerAccount, sa.IsSellerAccount, sa.Company, sa.ProfilePicture,
                   sa.Email, sa.Contact, sa.Country, sa.IsTestAccount, sa.IsActive,
                   sa.DateCreated, sa.DateModified
            FROM dbo.SubAccountCredential AS sa
            WHERE sa.AccountId = @AccountId AND UPPER(sa.UserName) = UPPER(@UserName);";

        var sub = await db.QueryFirstOrDefaultAsync<SubAccountDto>(new CommandDefinition(sql, new { AccountId = accountId, UserName = userName }, cancellationToken: cancellationToken));
        if (sub == null)
            return null;

        const string permissionsSql = @"
            SELECT ScreenName, CanView, CanCreate, CanEdit, CanDelete
            FROM dbo.SubAccountScreenAccess
            WHERE AccountId = @AccountId AND SubUserId = @SubUserId;";

        var permissions = (await db.QueryAsync<SubAccountScreenAccessDto>(
            new CommandDefinition(permissionsSql, new { AccountId = accountId, SubUserId = sub.SubUserId }, cancellationToken: cancellationToken))).ToList();

        sub.ScreenAccess = permissions;

        const string auditSql = @"
            SELECT Sequence, UserName, Field, Description, DateModified, ModifiedBy
            FROM dbo.SubAccountCredentialAuditTrail
            WHERE UPPER(UserName) = UPPER(@UserName)
            ORDER BY DateModified DESC, Sequence DESC;";

        var audit = (await db.QueryAsync<SubAccountAuditTrailDto>(
            new CommandDefinition(auditSql, new { UserName = userName }, cancellationToken: cancellationToken))).ToList();

        sub.Audit = audit;

        return sub;
    }

    public async Task<SubAccountPayload> RegisterSubAccountTransactionAsync(SubAccountRequest request, string passwordHash, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var creationTime = DateTime.Now;

            // 1. Insert into dbo.Users
            const string insertUserSql = "INSERT INTO dbo.Users (UserName) VALUES (@UserName);";
            await db.ExecuteAsync(new CommandDefinition(insertUserSql, new { UserName = request.UserName }, transaction, cancellationToken: cancellationToken));

            const string getUserIdSql = "SELECT UserId FROM dbo.Users WHERE UserName = @UserName;";
            var subUserId = await db.ExecuteScalarAsync<string>(new CommandDefinition(getUserIdSql, new { UserName = request.UserName }, transaction, cancellationToken: cancellationToken))
                ?? throw new InvalidOperationException("Failed to generate UserId for sub-account.");

            // 2. Insert into dbo.SubAccountCredential
            const string insertCredentialSql = @"
                INSERT INTO dbo.SubAccountCredential
                (UserName, AccountId, SubUserId, Password, Designation, Department, IsCustomerAccount, IsSellerAccount, Company, ProfilePicture, Email, Contact, Country, IsTestAccount, IsActive, DateCreated, DateModified)
                VALUES
                (@UserName, @AccountId, @SubUserId, @Password, @Designation, @Department, 0, 0, @Company, @ProfilePicture, @Email, @Contact, @Country, @IsTestAccount, @IsActive, @DateCreated, @DateModified);";

            await db.ExecuteAsync(new CommandDefinition(
                insertCredentialSql,
                new
                {
                    UserName = request.UserName,
                    AccountId = request.UserAccountId,
                    SubUserId = subUserId,
                    Password = passwordHash,
                    Designation = request.Designation,
                    Department = request.Department,
                    Company = request.Company,
                    ProfilePicture = request.ProfilePicture,
                    Email = request.Email,
                    Contact = request.Contact,
                    Country = request.Country,
                    IsTestAccount = request.IsTestAccount,
                    IsActive = request.IsActive,
                    DateCreated = creationTime,
                    DateModified = creationTime
                },
                transaction,
                cancellationToken: cancellationToken));

            // 3. Insert screen permissions into dbo.SubAccountScreenAccess
            if (request.ScreenAccess is { Count: > 0 })
            {
                const string insertPermSql = @"
                    INSERT INTO dbo.SubAccountScreenAccess
                    (AccountId, SubUserId, ScreenName, CanView, CanCreate, CanEdit, CanDelete)
                    VALUES
                    (@AccountId, @SubUserId, @ScreenName, @CanView, @CanCreate, @CanEdit, @CanDelete);";

                foreach (var perm in request.ScreenAccess)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertPermSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            SubUserId = subUserId,
                            ScreenName = perm.ScreenName,
                            CanView = perm.CanView,
                            CanCreate = perm.CanCreate,
                            CanEdit = perm.CanEdit,
                            CanDelete = perm.CanDelete
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            // 4. Insert audit trail record
            const string insertAuditSql = @"
                INSERT INTO dbo.SubAccountCredentialAuditTrail
                (UserName, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@UserName, @Field, @Description, @DateModified, @ModifiedBy);";

            await db.ExecuteAsync(new CommandDefinition(
                insertAuditSql,
                new
                {
                    UserName = request.UserName,
                    Field = "All",
                    Description = $"Created sub-account for {request.UserName} ({request.Designation ?? "User"}) with {request.ScreenAccess?.Count ?? 0} screen access rules.",
                    DateModified = creationTime,
                    ModifiedBy = request.AdminUserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            var createdUser = await GetSubAccountByUserNameAsync(request.UserAccountId, request.UserName, cancellationToken);

            return new SubAccountPayload
            {
                Success = true,
                Message = $"Sub-account [{request.UserName}] was created successfully.",
                UserDetails = createdUser
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Error while creating sub-account: {ex.Message}"
            };
        }
    }

    public async Task<SubAccountPayload> UpdateSubAccountTransactionAsync(SubAccountRequest request, string? passwordHash, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var modificationTime = DateTime.Now;

            const string getSubUserSql = "SELECT SubUserId FROM dbo.SubAccountCredential WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";
            var subUserId = await db.ExecuteScalarAsync<string>(new CommandDefinition(getSubUserSql, new { AccountId = request.UserAccountId, UserName = request.UserName }, transaction, cancellationToken: cancellationToken));

            if (subUserId == null)
            {
                return new SubAccountPayload
                {
                    Success = false,
                    Message = $"Sub-account [{request.UserName}] could not be found."
                };
            }

            // 1. Update dbo.SubAccountCredential
            string updateCredentialSql = @"
                UPDATE dbo.SubAccountCredential
                SET
                    Designation = @Designation,
                    Department = @Department,
                    Company = @Company,
                    ProfilePicture = @ProfilePicture,
                    Email = @Email,
                    Contact = @Contact,
                    Country = @Country,
                    IsActive = @IsActive,
                    DateModified = @DateModified"
                    + (passwordHash != null ? ", Password = @Password" : "") +
                @" WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";

            await db.ExecuteAsync(new CommandDefinition(
                updateCredentialSql,
                new
                {
                    AccountId = request.UserAccountId,
                    UserName = request.UserName,
                    Designation = request.Designation,
                    Department = request.Department,
                    Company = request.Company,
                    ProfilePicture = request.ProfilePicture,
                    Email = request.Email,
                    Contact = request.Contact,
                    Country = request.Country,
                    IsActive = request.IsActive,
                    DateModified = modificationTime,
                    Password = passwordHash
                },
                transaction,
                cancellationToken: cancellationToken));

            // 2. Replace screen permissions in dbo.SubAccountScreenAccess
            const string deletePermsSql = "DELETE FROM dbo.SubAccountScreenAccess WHERE AccountId = @AccountId AND SubUserId = @SubUserId;";
            await db.ExecuteAsync(new CommandDefinition(deletePermsSql, new { AccountId = request.UserAccountId, SubUserId = subUserId }, transaction, cancellationToken: cancellationToken));

            if (request.ScreenAccess is { Count: > 0 })
            {
                const string insertPermSql = @"
                    INSERT INTO dbo.SubAccountScreenAccess
                    (AccountId, SubUserId, ScreenName, CanView, CanCreate, CanEdit, CanDelete)
                    VALUES
                    (@AccountId, @SubUserId, @ScreenName, @CanView, @CanCreate, @CanEdit, @CanDelete);";

                foreach (var perm in request.ScreenAccess)
                {
                    await db.ExecuteAsync(new CommandDefinition(
                        insertPermSql,
                        new
                        {
                            AccountId = request.UserAccountId,
                            SubUserId = subUserId,
                            ScreenName = perm.ScreenName,
                            CanView = perm.CanView,
                            CanCreate = perm.CanCreate,
                            CanEdit = perm.CanEdit,
                            CanDelete = perm.CanDelete
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }
            }

            // 3. Insert audit record
            const string insertAuditSql = @"
                INSERT INTO dbo.SubAccountCredentialAuditTrail
                (UserName, Field, Description, DateModified, ModifiedBy)
                VALUES
                (@UserName, @Field, @Description, @DateModified, @ModifiedBy);";

            var auditDesc = $"Updated profile, status ({ (request.IsActive ? "Active" : "Inactive") }), and permissions ({request.ScreenAccess?.Count ?? 0} screens configured).";
            if (passwordHash != null) auditDesc += " (Password was reset).";

            await db.ExecuteAsync(new CommandDefinition(
                insertAuditSql,
                new
                {
                    UserName = request.UserName,
                    Field = "Profile & Permissions",
                    Description = auditDesc,
                    DateModified = modificationTime,
                    ModifiedBy = request.AdminUserName
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            var updatedUser = await GetSubAccountByUserNameAsync(request.UserAccountId, request.UserName, cancellationToken);

            return new SubAccountPayload
            {
                Success = true,
                Message = $"Sub-account [{request.UserName}] was updated successfully.",
                UserDetails = updatedUser
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Error while updating sub-account: {ex.Message}"
            };
        }
    }

    public async Task<SubAccountPayload> DeleteSubAccountTransactionAsync(string accountId, string userName, string adminUserName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            const string getSubUserSql = "SELECT SubUserId FROM dbo.SubAccountCredential WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";
            var subUserId = await db.ExecuteScalarAsync<string>(new CommandDefinition(getSubUserSql, new { AccountId = accountId, UserName = userName }, transaction, cancellationToken: cancellationToken));

            if (subUserId != null)
            {
                const string deletePermsSql = "DELETE FROM dbo.SubAccountScreenAccess WHERE AccountId = @AccountId AND SubUserId = @SubUserId;";
                await db.ExecuteAsync(new CommandDefinition(deletePermsSql, new { AccountId = accountId, SubUserId = subUserId }, transaction, cancellationToken: cancellationToken));
            }

            const string deleteAuditSql = "DELETE FROM dbo.SubAccountCredentialAuditTrail WHERE UPPER(UserName) = UPPER(@UserName);";
            await db.ExecuteAsync(new CommandDefinition(deleteAuditSql, new { UserName = userName }, transaction, cancellationToken: cancellationToken));

            const string deleteSubSql = "DELETE FROM dbo.SubAccountCredential WHERE AccountId = @AccountId AND UPPER(UserName) = UPPER(@UserName);";
            await db.ExecuteAsync(new CommandDefinition(deleteSubSql, new { AccountId = accountId, UserName = userName }, transaction, cancellationToken: cancellationToken));

            const string deleteUserSql = "DELETE FROM dbo.Users WHERE UPPER(UserName) = UPPER(@UserName);";
            await db.ExecuteAsync(new CommandDefinition(deleteUserSql, new { UserName = userName }, transaction, cancellationToken: cancellationToken));

            transaction.Commit();

            return new SubAccountPayload
            {
                Success = true,
                Message = $"Sub-account [{userName}] was deleted successfully."
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Error while deleting sub-account: {ex.Message}"
            };
        }
    }
}
