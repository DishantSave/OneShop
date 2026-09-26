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

    public async Task<CompanyDto?> GetCompanyByCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        string getCompanyDetails = @"SELECT c.Sequence, c.AccountId, c.Code, c.Name,
                                         c.DisplayName, c.AddressLine1 AS AddressLineOne, c.AddressLine2 AS AddressLineTwo,
                                         c.City, c.StateCode, c.CountryCode, c.PostalCode, c.Contact, c.Email, c.Website,
                                         c.Logo, c.CurrencyCode, c.TimeZone, c.IsTestCompany, c.IsActive, c.DateCreated
                                  FROM dbo.Company AS c
                                  WHERE c.AccountId = @AccountId AND UPPER(c.Code) = UPPER(@Code)";

        var getCompanyDetailsCmd = new CommandDefinition(getCompanyDetails,
                                                 new { AccountId = accountId, Code = companyCode },
                                                 cancellationToken: cancellationToken);

        var company = await db.QueryFirstOrDefaultAsync<CompanyDto>(getCompanyDetailsCmd);
        if (company == null)
            return null;

        string getCompanyAuditTrailDetails = @"SELECT Sequence, AccountId, Code, Field, Description, DateModified, ModifiedBy
                                                FROM dbo.CompanyAuditTrail
                                                WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code)
                                                ORDER BY DateModified DESC, Sequence DESC";
        var getCompanyAuditTrailDetailsCmd = new CommandDefinition(getCompanyAuditTrailDetails,
                                                 new { AccountId = accountId, Code = companyCode },
                                                 cancellationToken: cancellationToken);

        var auditTrail = (await db.QueryAsync<CompanyAuditTrailDto>(getCompanyAuditTrailDetailsCmd)).ToList();

        company.Audit = auditTrail;
        return company;
    }

    public async Task<bool> ExistsByCompanyCodeAsync(string accountId, string companyCode, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        string sql = "SELECT COUNT(1) FROM dbo.Company WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code)";
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
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CompanyPayload()
            {
                Success = false,
                Message = $"Error while creating company {companyName}: {ex.Message}"
            };
        }
    }

    public async Task<CompanyPayload> UpdateCompanyTransactionAsync(
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
        CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var modificationTime = DateTime.Now;

            var current = await FetchCompanyDetails(userAccountId, companyCode, cancellationToken);

            var changes = new Dictionary<string, (string? OldValue, string? NewValue)>();

            if (current.Success && current.CompanyDetails is not null)
            {
                var company = current.CompanyDetails;

                void AddChange(string field, string? oldValue, string? newValue)
                {
                    if (!string.Equals(oldValue, newValue, StringComparison.OrdinalIgnoreCase))
                        changes[field] = (oldValue, newValue);
                }

                AddChange(nameof(company.Name), company.Name, companyName);
                AddChange(nameof(company.DisplayName), company.DisplayName, companyDisplayName);
                AddChange(nameof(company.AddressLineOne), company.AddressLineOne, addressLineOne);
                AddChange(nameof(company.AddressLineTwo), company.AddressLineTwo, addressLineTwo);
                AddChange(nameof(company.City), company.City, city);
                AddChange(nameof(company.StateCode), company.StateCode, stateCode);
                AddChange(nameof(company.CountryCode), company.CountryCode, countryCode);
                AddChange(nameof(company.PostalCode), company.PostalCode, postalCode);
                AddChange(nameof(company.Contact), company.Contact, contact);
                AddChange(nameof(company.Email), company.Email, email);
                AddChange(nameof(company.Website), company.Website, website);
                AddChange(nameof(company.Logo), company.Logo, logo);
                AddChange(nameof(company.CurrencyCode), company.CurrencyCode, currencyCode);
                AddChange(nameof(company.TimeZone), company.TimeZone, timeZone);
                AddChange(nameof(company.IsTestCompany), company.IsTestCompany.ToString(), isTestCompany.ToString());
                AddChange(nameof(company.IsActive), company.IsActive.ToString(), isActive.ToString());
            }

            if (changes.Count > 0)
            {
                var field = string.Join(",", changes.Keys);

                var description = string.Join(
                    Environment.NewLine,
                    changes.Select(x =>
                        $"- [{x.Key}] changed from '{FormatAuditValue(x.Key, x.Value.OldValue)}' to '{FormatAuditValue(x.Key, x.Value.NewValue)}'"));

                if (description.Length > 1000)
                {
                    description = description[..997] + "...";
                }

                if (field.Length > 200)
                {
                    field = field[..197] + "...";
                }

                const string auditSql = """
                INSERT INTO dbo.CompanyAuditTrail
                (
                    AccountId,
                    Code,
                    Field,
                    Description,
                    DateModified,
                    ModifiedBy
                )
                VALUES
                (
                    @AccountId,
                    @Code,
                    @Field,
                    @Description,
                    @DateModified,
                    @ModifiedBy
                );
                """;

                await db.ExecuteAsync(
                    new CommandDefinition(
                        auditSql,
                        new
                        {
                            AccountId = userAccountId,
                            Code = companyCode,
                            Field = field,
                            Description = description,
                            DateModified = modificationTime,
                            ModifiedBy = userName
                        },
                        transaction,
                        cancellationToken: cancellationToken));
            }

            const string updateSql = """
            UPDATE dbo.Company
            SET
                Name = @Name,
                DisplayName = @DisplayName,
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
                IsTestCompany = @IsTestCompany,
                IsActive = @IsActive
            WHERE AccountId = @AccountId
                AND Code = @Code;
            """;

            await db.ExecuteAsync(
                new CommandDefinition(
                    updateSql,
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
                        IsActive = isActive
                    },
                    transaction,
                    cancellationToken: cancellationToken));

            transaction.Commit();

            var result = await FetchCompanyDetails(
                userAccountId,
                companyCode,
                cancellationToken);

            return new CompanyPayload()
            {
                Success = result.Success,
                Message = $"Company {companyCode} was updated successfully.",
                CompanyDetails = result.CompanyDetails
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CompanyPayload()
            {
                Success = false,
                Message = $"Error while updating company {companyName}: {ex.Message}"
            };
        }
    }

    public async Task<CompanyPayload> DeleteCompanyTransactionAsync(
        string userAccountId,
        string companyCode,
        string userName,
        CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);

        using var transaction = db.BeginTransaction();
        try
        {
            var modificationTime = DateTime.Now;

            const string deleteSql = """
            DELETE FROM dbo.CompanyAuditTrail
            WHERE AccountId = @AccountId
                  AND Code = @Code;

            DELETE FROM dbo.Company
            WHERE AccountId = @AccountId
                  AND Code = @Code;
            """;

            await db.ExecuteAsync(
                new CommandDefinition(
                    deleteSql,
                    new
                    {
                        AccountId = userAccountId,
                        Code = companyCode
                    },
                    transaction,
                    cancellationToken: cancellationToken));

            transaction.Commit();

            return new CompanyPayload()
            {
                Success = true,
                Message = $"Company {companyCode} was deleted successfully.",
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new CompanyPayload()
            {
                Success = false,
                Message = $"Error while deleting company {companyCode}: {ex.Message}"
            };
        }
    }

    private async Task<CompanyPayload> FetchCompanyDetails(string accountId, string companyCode, CancellationToken cancellationToken)
    {
        var company = await GetCompanyByCodeAsync(accountId, companyCode, cancellationToken);
        if (company == null)
        {
            return new CompanyPayload()
            {
                Success = false,
                Message = $"Company [{companyCode}] could not be found."
            };
        }

        return new CompanyPayload()
        {
            Success = true,
            Message = "Operation completed successfully.",
            CompanyDetails = company
        };
    }

    private static string FormatAuditValue(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "(empty)";
        }

        if (field.Equals(nameof(CompanyDto.Logo), StringComparison.OrdinalIgnoreCase))
        {
            if (value.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                return "[image data]";
            }

            if (value.Length > 80)
            {
                return $"{value[..77]}...";
            }
        }

        if (value.Length > 100)
        {
            return $"{value[..97]}...";
        }

        return value;
    }
}