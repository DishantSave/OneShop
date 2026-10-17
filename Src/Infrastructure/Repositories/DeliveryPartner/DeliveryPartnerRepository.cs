using Application.Common.Tenant;
using Application.DTOs.DeliveryPartner;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.DeliveryPartner;

public class DeliveryPartnerRepository(IHttpContextAccessor httpContextAccessor) : IDeliveryPartnerRepository
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

    public async Task<IEnumerable<DeliveryPartnerDto>> GetDeliveryPartnersAsync(string accountId, string? companyCode = null, string? channel = null, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        if (cancellationToken.IsCancellationRequested)
            return Enumerable.Empty<DeliveryPartnerDto>();

        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());

            const string sql = @"
                SELECT dp.Sequence, dp.AccountId, dp.CompanyCode, dp.PartnerName, dp.Channel,
                       dp.ItemCategory, dp.BaseShippingRate, dp.PerItemShippingRate, dp.FreeShippingThreshold,
                       dp.EstimatedDays, dp.IsDefault, dp.IsActive, dp.DateCreated, dp.DateModified, dp.CreatedBy
                FROM dbo.DeliveryPartner AS dp
                WHERE (@IsCustomer = 1 OR dp.AccountId = @AccountId)
                  AND (@CompanyCode IS NULL OR UPPER(dp.CompanyCode) = UPPER(@CompanyCode))
                  AND (@Channel IS NULL OR UPPER(dp.Channel) = UPPER(@Channel) OR UPPER(dp.Channel) = 'BOTH' OR UPPER(@Channel) = 'BOTH')
                  AND dp.IsActive = 1
                ORDER BY dp.IsDefault DESC, dp.Sequence ASC;";

            return await db.QueryAsync<DeliveryPartnerDto>(new CommandDefinition(
                sql,
                new { AccountId = accountId, CompanyCode = companyCode, Channel = channel, IsCustomer = isCustomer ? 1 : 0 },
                cancellationToken: cancellationToken));
        }
        catch (OperationCanceledException)
        {
            return Enumerable.Empty<DeliveryPartnerDto>();
        }
    }

    public async Task<DeliveryPartnerDto?> GetDeliveryPartnerByIdAsync(string accountId, long sequence, CancellationToken cancellationToken = default)
    {
        if (cancellationToken.IsCancellationRequested)
            return null;

        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());

            const string sql = @"
                SELECT dp.Sequence, dp.AccountId, dp.CompanyCode, dp.PartnerName, dp.Channel,
                       dp.ItemCategory, dp.BaseShippingRate, dp.PerItemShippingRate, dp.FreeShippingThreshold,
                       dp.EstimatedDays, dp.IsDefault, dp.IsActive, dp.DateCreated, dp.DateModified, dp.CreatedBy
                FROM dbo.DeliveryPartner AS dp
                WHERE dp.Sequence = @Sequence AND dp.AccountId = @AccountId;";

            return await db.QueryFirstOrDefaultAsync<DeliveryPartnerDto>(new CommandDefinition(
                sql,
                new { Sequence = sequence, AccountId = accountId },
                cancellationToken: cancellationToken));
        }
        catch (OperationCanceledException)
        {
            return null;
        }
    }

    public async Task<DeliveryPartnerPayload> SaveDeliveryPartnerAsync(string accountId, string userName, DeliveryPartnerRequest request, long? sequence = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        try
        {
            var companyCode = request.CompanyCode.Trim().ToUpper();
            var partnerName = request.PartnerName.Trim();
            var channel = string.IsNullOrWhiteSpace(request.Channel) ? "B2C" : request.Channel.Trim();
            var category = string.IsNullOrWhiteSpace(request.ItemCategory) ? "ALL" : request.ItemCategory.Trim();

            if (request.IsDefault)
            {
                // Clear existing default for this company and channel
                const string clearDefaultSql = @"
                    UPDATE dbo.DeliveryPartner 
                    SET IsDefault = 0 
                    WHERE AccountId = @AccountId 
                      AND UPPER(CompanyCode) = UPPER(@CompanyCode) 
                      AND (UPPER(Channel) = UPPER(@Channel) OR Channel = 'Both');";

                await db.ExecuteAsync(new CommandDefinition(
                    clearDefaultSql,
                    new { AccountId = accountId, CompanyCode = companyCode, Channel = channel },
                    cancellationToken: cancellationToken));
            }

            if (sequence.HasValue && sequence.Value > 0)
            {
                const string updateSql = @"
                    UPDATE dbo.DeliveryPartner
                    SET CompanyCode = @CompanyCode,
                        PartnerName = @PartnerName,
                        Channel = @Channel,
                        ItemCategory = @ItemCategory,
                        BaseShippingRate = @BaseShippingRate,
                        PerItemShippingRate = @PerItemShippingRate,
                        FreeShippingThreshold = @FreeShippingThreshold,
                        EstimatedDays = @EstimatedDays,
                        IsDefault = @IsDefault,
                        IsActive = @IsActive,
                        DateModified = SYSDATETIME()
                    WHERE Sequence = @Sequence AND AccountId = @AccountId;";

                await db.ExecuteAsync(new CommandDefinition(
                    updateSql,
                    new
                    {
                        Sequence = sequence.Value,
                        AccountId = accountId,
                        CompanyCode = companyCode,
                        PartnerName = partnerName,
                        Channel = channel,
                        ItemCategory = category,
                        BaseShippingRate = request.BaseShippingRate,
                        PerItemShippingRate = request.PerItemShippingRate,
                        FreeShippingThreshold = request.FreeShippingThreshold,
                        EstimatedDays = request.EstimatedDays,
                        IsDefault = request.IsDefault ? 1 : 0,
                        IsActive = request.IsActive ? 1 : 0
                    },
                    cancellationToken: cancellationToken));

                var updated = await GetDeliveryPartnerByIdAsync(accountId, sequence.Value, cancellationToken);
                return new DeliveryPartnerPayload { Success = true, Message = "Delivery partner updated successfully.", Data = updated };
            }
            else
            {
                const string insertSql = @"
                    INSERT INTO dbo.DeliveryPartner
                    (AccountId, CompanyCode, PartnerName, Channel, ItemCategory, BaseShippingRate, PerItemShippingRate, FreeShippingThreshold, EstimatedDays, IsDefault, IsActive, DateCreated, DateModified, CreatedBy)
                    VALUES
                    (@AccountId, @CompanyCode, @PartnerName, @Channel, @ItemCategory, @BaseShippingRate, @PerItemShippingRate, @FreeShippingThreshold, @EstimatedDays, @IsDefault, @IsActive, SYSDATETIME(), SYSDATETIME(), @CreatedBy);
                    SELECT CAST(SCOPE_IDENTITY() AS BIGINT);";

                var newId = await db.ExecuteScalarAsync<long>(new CommandDefinition(
                    insertSql,
                    new
                    {
                        AccountId = accountId,
                        CompanyCode = companyCode,
                        PartnerName = partnerName,
                        Channel = channel,
                        ItemCategory = category,
                        BaseShippingRate = request.BaseShippingRate,
                        PerItemShippingRate = request.PerItemShippingRate,
                        FreeShippingThreshold = request.FreeShippingThreshold,
                        EstimatedDays = request.EstimatedDays,
                        IsDefault = request.IsDefault ? 1 : 0,
                        IsActive = request.IsActive ? 1 : 0,
                        CreatedBy = userName
                    },
                    cancellationToken: cancellationToken));

                var created = await GetDeliveryPartnerByIdAsync(accountId, newId, cancellationToken);
                return new DeliveryPartnerPayload { Success = true, Message = "Delivery partner created successfully.", Data = created };
            }
        }
        catch (Exception ex)
        {
            return new DeliveryPartnerPayload { Success = false, Message = $"Failed to save delivery partner: {ex.Message}" };
        }
    }

    public async Task<DeliveryPartnerPayload> DeleteDeliveryPartnerAsync(string accountId, long sequence, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string sql = "DELETE FROM dbo.DeliveryPartner WHERE Sequence = @Sequence AND AccountId = @AccountId;";
        var affected = await db.ExecuteAsync(new CommandDefinition(sql, new { Sequence = sequence, AccountId = accountId }, cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new DeliveryPartnerPayload { Success = true, Message = "Delivery partner deleted successfully." };
        }

        return new DeliveryPartnerPayload { Success = false, Message = "Delivery partner not found or could not be deleted." };
    }

    public async Task<ShippingCalculationResult> CalculateShippingAsync(string accountId, string companyCode, string channel, decimal orderSubTotal, int totalItems, CancellationToken cancellationToken = default)
    {
        if (cancellationToken.IsCancellationRequested)
            return new ShippingCalculationResult();

        try
        {
            using IDbConnection db = new SqlConnection(GetConnectionString());

            const string sql = @"
                SELECT TOP 1 *
                FROM dbo.DeliveryPartner
                WHERE UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND (UPPER(Channel) = UPPER(@Channel) OR Channel = 'Both' OR UPPER(@Channel) = 'BOTH')
                  AND IsActive = 1
                ORDER BY IsDefault DESC, Sequence ASC;";

            var partner = await db.QueryFirstOrDefaultAsync<DeliveryPartnerDto>(new CommandDefinition(
                sql,
                new { CompanyCode = companyCode, Channel = channel },
                cancellationToken: cancellationToken));

            if (partner == null)
            {
                // Fallback default
                var fallbackPartner = channel.Equals("B2B", StringComparison.OrdinalIgnoreCase) ? "BlueDart Cargo B2B" : "Delhivery Express";
                var freeThreshold = 500.00m;
                var isFree = orderSubTotal >= freeThreshold;
                var shipping = isFree ? 0.00m : (5.00m + (Math.Max(1, totalItems) * 1.00m));
                return new ShippingCalculationResult
                {
                    AssignedPartnerName = fallbackPartner,
                    TotalShippingCost = shipping,
                    PerItemShippingCost = isFree ? 0.00m : 1.00m,
                    IsFreeShipping = isFree,
                    FreeShippingThreshold = freeThreshold,
                    EstimatedDays = 3
                };
            }

            var isFreeShipping = orderSubTotal >= partner.FreeShippingThreshold && partner.FreeShippingThreshold > 0;
            decimal totalShipping;
            decimal perItemCost;

            if (isFreeShipping)
            {
                totalShipping = 0.00m;
                perItemCost = 0.00m;
            }
            else
            {
                perItemCost = partner.PerItemShippingRate;
                totalShipping = partner.BaseShippingRate + (Math.Max(1, totalItems) * partner.PerItemShippingRate);
            }

            return new ShippingCalculationResult
            {
                AssignedPartnerName = partner.PartnerName,
                TotalShippingCost = totalShipping,
                PerItemShippingCost = perItemCost,
                IsFreeShipping = isFreeShipping,
                FreeShippingThreshold = partner.FreeShippingThreshold,
                EstimatedDays = partner.EstimatedDays
            };
        }
        catch (OperationCanceledException)
        {
            return new ShippingCalculationResult();
        }
    }
}
