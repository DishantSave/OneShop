using Application.Common.Tenant;
using Application.DTOs.Masters.Company;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Masters;

public class CompanyRepository(IHttpContextAccessor httpContextAccessor) : ICompanyRepository
{
    readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private string GetConnectionString()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context != null && context.Items.TryGetValue("TenantContext", out var tenantObj) && tenantObj is ITenantContext tenant)
        {
            return tenant.ConnectionString;
        }

        throw new InvalidOperationException("Tenant context could not be resolved for this request.");
    }

    public async Task<IEnumerable<CompanyDto>> GetAllCompaniesAsync(string accountId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = @"SELECT c.Sequence, c.AccountId, c.Code, c.Name,
                              c.DisplayName, c.AddressLine1 AS AddressLineOne, c.AddressLine2 AS AddressLineTwo,
                              c.City, c.StateCode, c.CountryCode, c.PostalCode, c.Contact, c.Email, c.Website,
                              c.Logo, c.CurrencyCode, c.TimeZone, c.IsTestCompany, c.IsActive, c.DateCreated
                       FROM dbo.Company AS c
                       WHERE c.AccountId = @AccountId";

        var command = new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: cancellationToken);
        return await db.QueryAsync<CompanyDto>(command);
    }

    public async Task<IEnumerable<CompanyAuditTrailDto>> GetAllCompaniesAuditDetailsAsync(string accountId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        
        string sql = @"SELECT Sequence, AccountId, Code, Field, Description, DateModified, ModifiedBy
                       FROM dbo.CompanyAuditTrail
                       WHERE AccountId = @AccountId";

        var command = new CommandDefinition(sql, new { AccountId = accountId }, cancellationToken: cancellationToken);
        return await db.QueryAsync<CompanyAuditTrailDto>(command);
    }

    public async Task<bool> ExistsByCompanyCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT COUNT(1) FROM dbo.Company WHERE AccountId = @AccountId AND Code = @Code";
        var command = new CommandDefinition(sql, new { AccountId = accountId, Code = companyCode }, cancellationToken: cancellationToken);
        var count = await db.ExecuteScalarAsync<int>(command);
        return count > 0;
    }

    public async Task<CompanyPayload> RegisterCompanyTransactionAsync(
        string userAccountId,
        string userName,
        string companyCode,
        string companyName,
        string companyDisplayName,
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
        bool isTestCompany,
        bool isActive,
        //DateTime dateCreated,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        db.Open();

        using var transaction = db.BeginTransaction();
        try
        {
            var companyCreationTime = DateTime.Now;

            string insertCompanySql = @"
                INSERT INTO dbo.Company 
                (AccountId, Code, Name, DisplayName, AddressLine1, AddressLine2, City, StateCode, CountryCode, PostalCode, Contact, Email, Website, Logo, CurrencyCode, TimeZone, IsTestCompany, IsActive, DateCreated)
                VALUES 
                (@AccountId, @Code, @Name, @DisplayName, @AddressLine1, @AddressLine2, @City, @StateCode, @CountryCode, @PostalCode, @Contact, @Email, @Website, @Logo, @CurrencyCode, @TimeZone, @IsTestCompany, @IsActive, @DateCreated);";

            var insertCompanyCmd = new CommandDefinition(insertCompanySql,
                                                      new
                                                      {
                                                          AccountId = userAccountId,
                                                          Code = companyCode,
                                                          Name = companyName,
                                                          DisplayName = companyDisplayName,
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
                                                          IsTestCompany = isTestCompany,
                                                          IsActive = isActive,
                                                          DateCreated = companyCreationTime
                                                      },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertCompanyCmd);

            string insertCompanyCreationAuditTrailSql = @"INSERT INTO dbo.CompanyAuditTrail
                                                       (AccountId, Code, Field, Description, DateModified, ModifiedBy)
                                                       VALUES
                                                       (@AccountId, @Code, @Field, @Description, @DateModified, @ModifiedBy);";
            var insertCompanyCreationAuditTrailCmd = new CommandDefinition(insertCompanyCreationAuditTrailSql,
                                                      new
                                                      {
                                                          AccountId = userAccountId,
                                                          Code = companyCode,
                                                          Field = "All",
                                                          Description = $"Created new Company [{companyCode} - {companyName}].",
                                                          DateModified = companyCreationTime,
                                                          ModifiedBy = userName
                                                      },
                                                      transaction: transaction,
                                                      cancellationToken: cancellationToken);

            await db.ExecuteAsync(insertCompanyCreationAuditTrailCmd);

            transaction.Commit();

            return await FetchCompanyDetails(userAccountId, companyCode, cancellationToken);
        }
        catch
        {
            transaction.Rollback();
            return new CompanyPayload()
            {
                Success = false,
                Message = $"Error while Creating the Company {companyName}."
            };
        }
    }

    private async Task<CompanyPayload> FetchCompanyDetails(string accountId, string companyCode, CancellationToken cancellationToken)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        string getCompanyDetails = @"SELECT c.Sequence, c.AccountId, c.Code, c.Name,
                                         c.DisplayName, c.AddressLine1 AS AddressLineOne, c.AddressLine2 AS AddressLineTwo,
                                         c.City, c.StateCode, c.CountryCode, c.PostalCode, c.Contact, c.Email, c.Website,
                                         c.Logo, c.CurrencyCode, c.TimeZone, c.IsTestCompany, c.IsActive, c.DateCreated
                                  FROM dbo.Company AS c
                                  WHERE c.AccountId = @AccountId AND c.Code = @Code";

        var getCompanyDetailsCmd = new CommandDefinition(getCompanyDetails,
                                                 new { AccountId = accountId, Code = companyCode },
                                                 cancellationToken: cancellationToken);

        var company = await db.QuerySingleAsync<CompanyDto>(getCompanyDetailsCmd);

        string getCompanyAuditTrailDetails = @"SELECT Sequence, AccountId, Code, Field, Description, DateModified, ModifiedBy
                                                FROM dbo.CompanyAuditTrail
                                                WHERE AccountId = @AccountId AND Code = @Code";
        var getCompanyAuditTrailDetailsCmd = new CommandDefinition(getCompanyAuditTrailDetails,
                                                 new { AccountId = accountId, Code = companyCode },
                                                 cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<CompanyAuditTrailDto>(getCompanyAuditTrailDetailsCmd)).ToList();

        company.Audit = auditTrail;

        return new CompanyPayload()
        {
            Success = true,
            Message = "Registration successful.",
            CompanyDetails = company
        };
    }
}