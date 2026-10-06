using Application.Common.Tenant;
using Application.DTOs.Discounts;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Discounts;

public class PromoCodeRepository(IHttpContextAccessor httpContextAccessor) : IPromoCodeRepository
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

    public async Task<IEnumerable<PromoCodeDto>> GetPromoCodesAsync(string accountId, bool? activeOnly = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, Code, Description, DiscountType, DiscountValue,
                   MinOrderAmount, MaxDiscountAmount, ValidFrom, ValidUntil, UsageLimit,
                   TimesUsed, IsActive, DateCreated, CreatedBy
            FROM dbo.PromoCode
            WHERE AccountId = @AccountId
              AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly)
            ORDER BY DateCreated DESC;";

        return await db.QueryAsync<PromoCodeDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, ActiveOnly = activeOnly },
            cancellationToken: cancellationToken));
    }

    public async Task<PromoCodeDto?> GetPromoCodeByCodeAsync(string accountId, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT TOP 1 Sequence, AccountId, Code, Description, DiscountType, DiscountValue,
                         MinOrderAmount, MaxDiscountAmount, ValidFrom, ValidUntil, UsageLimit,
                         TimesUsed, IsActive, DateCreated, CreatedBy
            FROM dbo.PromoCode
            WHERE AccountId = @AccountId
              AND UPPER(Code) = UPPER(@Code);";

        return await db.QueryFirstOrDefaultAsync<PromoCodeDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, Code = code.Trim() },
            cancellationToken: cancellationToken));
    }

    public async Task<PromoCodePayload> SavePromoCodeAsync(PromoCodeRequest request, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            IF EXISTS (SELECT 1 FROM dbo.PromoCode WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code))
            BEGIN
                UPDATE dbo.PromoCode
                SET Description = @Description,
                    DiscountType = @DiscountType,
                    DiscountValue = @DiscountValue,
                    MinOrderAmount = @MinOrderAmount,
                    MaxDiscountAmount = @MaxDiscountAmount,
                    ValidFrom = @ValidFrom,
                    ValidUntil = @ValidUntil,
                    UsageLimit = @UsageLimit,
                    IsActive = @IsActive
                WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code);
            END
            ELSE
            BEGIN
                INSERT INTO dbo.PromoCode
                (AccountId, Code, Description, DiscountType, DiscountValue, MinOrderAmount, MaxDiscountAmount, ValidFrom, ValidUntil, UsageLimit, TimesUsed, IsActive, DateCreated, CreatedBy)
                VALUES
                (@AccountId, @Code, @Description, @DiscountType, @DiscountValue, @MinOrderAmount, @MaxDiscountAmount, @ValidFrom, @ValidUntil, @UsageLimit, 0, @IsActive, SYSDATETIME(), @CreatedBy);
            END;";

        var validFrom = request.ValidFrom ?? DateTime.UtcNow;
        var validUntil = request.ValidUntil ?? DateTime.UtcNow.AddYears(1);

        await db.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                AccountId = request.AccountId,
                Code = request.Code.Trim().ToUpper(),
                Description = request.Description?.Trim(),
                DiscountType = string.IsNullOrWhiteSpace(request.DiscountType) ? "Percentage" : request.DiscountType.Trim(),
                DiscountValue = request.DiscountValue,
                MinOrderAmount = request.MinOrderAmount,
                MaxDiscountAmount = request.MaxDiscountAmount,
                ValidFrom = validFrom,
                ValidUntil = validUntil,
                UsageLimit = request.UsageLimit,
                IsActive = request.IsActive,
                CreatedBy = request.UserName
            },
            cancellationToken: cancellationToken));

        var updated = await GetPromoCodeByCodeAsync(request.AccountId, request.Code, cancellationToken);

        return new PromoCodePayload
        {
            Success = true,
            Message = $"Promo code [{request.Code.ToUpper()}] saved successfully.",
            PromoDetails = updated
        };
    }

    public async Task<PromoCodePayload> DeletePromoCodeAsync(string accountId, string code, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            DELETE FROM dbo.PromoCode
            WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = accountId, Code = code.Trim().ToUpper() },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new PromoCodePayload { Success = true, Message = $"Promo code [{code}] deleted successfully." };
        }

        return new PromoCodePayload { Success = false, Message = $"Promo code [{code}] was not found." };
    }

    public async Task<PromoValidationResultDto> ValidatePromoCodeAsync(string accountId, string code, decimal orderSubTotal, CancellationToken cancellationToken = default)
    {
        var promo = await GetPromoCodeByCodeAsync(accountId, code, cancellationToken);
        if (promo == null)
        {
            return new PromoValidationResultDto
            {
                IsValid = false,
                Message = $"Promo code '{code.ToUpper()}' not found."
            };
        }

        if (!promo.IsActive)
        {
            return new PromoValidationResultDto
            {
                IsValid = false,
                Message = $"Promo code '{promo.Code}' is no longer active."
            };
        }

        var now = DateTime.UtcNow;
        if (now < promo.ValidFrom || now > promo.ValidUntil)
        {
            return new PromoValidationResultDto
            {
                IsValid = false,
                Message = $"Promo code '{promo.Code}' has expired or is not yet valid."
            };
        }

        if (promo.UsageLimit > 0 && promo.TimesUsed >= promo.UsageLimit)
        {
            return new PromoValidationResultDto
            {
                IsValid = false,
                Message = $"Promo code '{promo.Code}' has reached its maximum usage limit."
            };
        }

        if (orderSubTotal < promo.MinOrderAmount)
        {
            return new PromoValidationResultDto
            {
                IsValid = false,
                Message = $"Minimum order amount of ₹{promo.MinOrderAmount:N2} required to apply this promo."
            };
        }

        decimal discount = 0;
        if (promo.DiscountType.Equals("Percentage", StringComparison.OrdinalIgnoreCase))
        {
            discount = (orderSubTotal * promo.DiscountValue) / 100m;
            if (promo.MaxDiscountAmount.HasValue && promo.MaxDiscountAmount.Value > 0 && discount > promo.MaxDiscountAmount.Value)
            {
                discount = promo.MaxDiscountAmount.Value;
            }
        }
        else
        {
            discount = promo.DiscountValue;
            if (discount > orderSubTotal)
            {
                discount = orderSubTotal;
            }
        }

        return new PromoValidationResultDto
        {
            IsValid = true,
            Message = $"Promo code '{promo.Code}' applied successfully! Savings: ₹{discount:N2}",
            Code = promo.Code,
            DiscountType = promo.DiscountType,
            DiscountValue = promo.DiscountValue,
            CalculatedDiscount = decimal.Round(discount, 2)
        };
    }
}
