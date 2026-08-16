using Application.Common.Tenant;
using Application.DTOs.Auth;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories;

public class AuthenticationRepository(IHttpContextAccessor httpContextAccessor, IJwtTokenService jwtTokenService) : IAuthenticationRepository
{
    readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly IJwtTokenService _jwtTokenService = jwtTokenService;

    private string GetConnectionString()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null && context.Items.TryGetValue("TenantContext", out var tenantObj) && tenantObj is ITenantContext tenant)
        {
            return tenant.ConnectionString;
        }

        throw new InvalidOperationException("Tenant context could not be resolved for this request.");
    }

    public async Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT COUNT(1) FROM dbo.Users WHERE UserName = @UserName";
        var command = new CommandDefinition(sql, new { UserName = userName }, cancellationToken: cancellationToken);
        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT COUNT(1) FROM dbo.AccountCredential WHERE Email = @Email";
        var command = new CommandDefinition(sql, new { Email = email }, cancellationToken: cancellationToken);
        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<bool> ExistsByContactAsync(string contact, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT COUNT(1) FROM dbo.AccountCredential WHERE Contact = @Contact";

        var command = new CommandDefinition(sql, new { Contact = contact }, cancellationToken: cancellationToken);
        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<AuthenticationPayload> RegisterUserTransactionAsync(
        string userName,
        string passwordHash,
        string apiTokenKey,
        bool isCustomer,
        bool isSeller,
        string? company,
        string profilePicture,
        string email,
        string contact,
        string country,
        bool isTestAccount,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        db.Open();

        using var transaction = db.BeginTransaction();
        try
        {
            var userCreationTime = DateTime.Now;

            string insertUserSql = "INSERT INTO dbo.Users (UserName) VALUES (@UserName);";
            var insertUserCmd = new CommandDefinition(insertUserSql,
                                                      new { UserName = userName },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertUserCmd);

            string getUserIdSql = "SELECT UserId FROM dbo.Users WHERE UserName = @UserName;";
            var getUserIdCmd = new CommandDefinition(getUserIdSql,
                                                     new { UserName = userName },
                                                     transaction: transaction,
                                                     cancellationToken: cancellationToken);

            var userId = await db.ExecuteScalarAsync<string>(getUserIdCmd);

            string insertCredentialSql = @"
                INSERT INTO dbo.AccountCredential 
                (UserName, UserId, Password, ApiTokenKey, IsCustomerAccount, IsSellerAccount, Company, ProfilePicture, Email, Contact, Country, IsTestAccount, DateCreated, DateModified)
                VALUES 
                (@UserName, @UserId, @Password, @ApiTokenKey, @IsCustomerAccount, @IsSellerAccount, @Company, @ProfilePicture, @Email, @Contact, @Country, @IsTestAccount, @DateCreated, @DateModified);";

            var insertCredCmd = new CommandDefinition(insertCredentialSql,
                                                      new
                                                      {
                                                          UserName = userName,
                                                          UserId = userId,
                                                          Password = passwordHash,
                                                          ApiTokenKey = apiTokenKey,
                                                          IsCustomerAccount = isCustomer,
                                                          IsSellerAccount = isSeller,
                                                          Company = company,
                                                          ProfilePicture = profilePicture,
                                                          Email = email,
                                                          Contact = contact,
                                                          Country = country,
                                                          IsTestAccount = isTestAccount,
                                                          DateCreated = userCreationTime,
                                                          DateModified = userCreationTime
                                                      },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertCredCmd);

            string getAccountIdSql = "SELECT AccountId FROM dbo.AccountCredential WHERE UserName = @UserName AND UserId = @UserId;";
            var getAccountIdCmd = new CommandDefinition(getAccountIdSql,
                                                     new { UserName = userName, UserId = userId },
                                                     transaction: transaction,
                                                     cancellationToken: cancellationToken);

            var accountId = await db.ExecuteScalarAsync<string>(getAccountIdCmd);

            string insertAccountSubscriptionSql = @"INSERT INTO dbo.AccountSubscription
                                                    (AccountId, SubscriptionType, StartDate)
                                                    VALUES
                                                    (@AccountId, @SubscriptionType, @StartDate);";
            var insertAccountSubscriptionCmd = new CommandDefinition(insertAccountSubscriptionSql,
                                                      new
                                                      {
                                                          AccountId = accountId,
                                                          SubscriptionType = "Basic", // Can have values: (Basic, Plus, Pro, Enterprise)
                                                          StartDate = userCreationTime
                                                      },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertAccountSubscriptionCmd);

            string insertUserCreationAuditTrailSql = @"INSERT INTO dbo.AccountCredentialAuditTrail
                                                       (UserName, Field, Description, DateModified)
                                                       VALUES
                                                       (@UserName, @Field, @Description, @DateModified);";
            var insertUserCreationAuditTrailCmd = new CommandDefinition(insertUserCreationAuditTrailSql,
                                                      new {
                                                          UserName = userName,
                                                          Field = "All",
                                                          Description = $"Created new User {userName}.",
                                                          DateModified = userCreationTime
                                                      },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertUserCreationAuditTrailCmd);

            transaction.Commit();

            return await FetchAuthenticationResponse(userName, cancellationToken);

            /*string getUserDetails = @"SELECT ac.UserName, ac.UserId, ac.AccountId, ac.ApiTokenKey AS ApiToken,
                                             ac.IsCustomerAccount, ac.IsSellerAccount, ac.Company, ac.ProfilePicture,
                                             ac.Email, ac.Contact, ac.Country, ac.IsTestAccount, ac.DateCreated AS Created,
                                             acs.SubscriptionType
                                      FROM dbo.AccountCredential AS ac
                                      INNER JOIN AccountSubscription AS acs ON ac.AccountId = acs.AccountId
                                      WHERE UserName = @UserName AND UserId = @UserId;";
            var getUserDetailsCmd = new CommandDefinition(getUserDetails,
                                                     new { UserName = userName, UserId = userId },
                                                     transaction: transaction,
                                                     cancellationToken: cancellationToken);

            var user = await db.QuerySingleAsync<UserDetailDto>(getUserDetailsCmd);

            string getUserAuditTrailDetails = @"SELECT UserName, Field, Description, DateModified
                                                FROM dbo.AccountCredentialAuditTrail
                                                WHERE UserName = @UserName;";
            var getUserAuditTrailDetailsCmd = new CommandDefinition(getUserAuditTrailDetails,
                                                     new { UserName = userName },
                                                     transaction: transaction,
                                                     cancellationToken: cancellationToken);

            var auditTrail = (await db.QueryAsync<UserDetailAuditTrail>(getUserAuditTrailDetailsCmd)).ToList();

            user.Audit = auditTrail;

            return new AuthenticationResponse() {
                Success = true,
                Message = "Registration successful.",
                UserDetails = user
            };*/
        }
        catch
        {
            transaction.Rollback();
            return new AuthenticationPayload()
            {
                Success = false,
                Message = "Error while Creating the User."
            };
        }
    }

    public async Task<AuthenticationPayload> AuthenticateUserAsync(string userName, string password, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        string sql = @"
            SELECT Password
            FROM dbo.AccountCredential 
            WHERE UserName = @UserName;";

        var command = new CommandDefinition(sql, new { UserName = userName }, cancellationToken: cancellationToken);
        var passwordHash = await db.QueryFirstOrDefaultAsync<string>(command);

        if (passwordHash == null)
        {
            return new AuthenticationPayload
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        var hasher = new PasswordHasher<object>();

        var passwordVerificationResult = hasher.VerifyHashedPassword(userName, passwordHash, password);

        if (passwordVerificationResult == PasswordVerificationResult.Failed)
        {
            return new AuthenticationPayload
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        return await FetchAuthenticationResponse(userName, cancellationToken);
    }

    private async Task<AuthenticationPayload> FetchAuthenticationResponse(string userName, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        string getUserDetails = @"SELECT ac.UserName, ac.UserId, ac.AccountId, ac.ApiTokenKey AS ApiToken,
                                         ac.IsCustomerAccount, ac.IsSellerAccount, ac.Company, ac.ProfilePicture,
                                         ac.Email, ac.Contact, ac.Country, ac.IsTestAccount, ac.DateCreated AS Created,
                                         acs.SubscriptionType
                                  FROM dbo.AccountCredential AS ac
                                  INNER JOIN AccountSubscription AS acs ON ac.AccountId = acs.AccountId
                                  WHERE ac.UserName = @UserName"; //AND ac.UserId = @UserId;";
        var getUserDetailsCmd = new CommandDefinition(getUserDetails,
                                                 new { UserName = userName/*, UserId = userId*/ },
                                                 //transaction: transaction,
                                                 cancellationToken: cancellationToken);

        var user = await db.QuerySingleAsync<UserDetailDto>(getUserDetailsCmd);

        var token = _jwtTokenService.GenerateToken(
            user.AccountId,
            user.UserId,
            user.UserName);

        user.ApiToken = token;

        string getUserAuditTrailDetails = @"SELECT UserName, Field, Description, DateModified
                                                FROM dbo.AccountCredentialAuditTrail
                                                WHERE UserName = @UserName;";
        var getUserAuditTrailDetailsCmd = new CommandDefinition(getUserAuditTrailDetails,
                                                 new { UserName = userName },
                                                 //transaction: transaction,
                                                 cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<UserDetailAuditTrailDto>(getUserAuditTrailDetailsCmd)).ToList();

        user.Audit = auditTrail;

        return new AuthenticationPayload()
        {
            Success = true,
            Message = "Registration successful.",
            UserDetails = user
        };
    }
}