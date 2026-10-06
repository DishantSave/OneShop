using Application.Common.Tenant;
using Application.DTOs.Order;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Dapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Infrastructure.Repositories.Order;

public class OrderRepository(IHttpContextAccessor httpContextAccessor) : IOrderRepository
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

    public async Task<IEnumerable<OrderDto>> GetOrdersAsync(string accountId, string? companyCode = null, string? status = null, string? locationCode = null, string? channel = null, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string sql = @"
            SELECT o.Sequence, o.AccountId, o.CompanyCode, c.Name AS CompanyName,
                   o.OrderId, o.ParentOrderId, o.Channel, o.LocationType, o.LocationCode,
                   COALESCE(wh.Name, st.Name, o.LocationCode) AS LocationName,
                   o.Status, o.PaymentStatus, o.CustomerName, o.CustomerEmail, o.CustomerPhone,
                   o.ShippingAddress, o.TotalItems, o.SubTotal, o.Tax, o.ShippingCost, o.Discount, o.TotalAmount,
                   o.Notes, o.OrderDate, o.DateCreated, o.CreatedBy,
                   o.ShipVia, o.DeliveryPartner, o.PickupLocationCode, o.PickupLocationName, o.ShippingState, o.PromoCode
            FROM dbo.Orders AS o
            INNER JOIN dbo.Company AS c ON o.AccountId = c.AccountId AND o.CompanyCode = c.Code
            LEFT JOIN dbo.Warehouse AS wh ON o.AccountId = wh.AccountId AND o.CompanyCode = wh.CompanyCode AND o.LocationCode = wh.Code AND o.LocationType = 'Warehouse'
            LEFT JOIN dbo.Store AS st ON o.AccountId = st.AccountId AND o.CompanyCode = st.CompanyCode AND o.LocationCode = st.Code AND o.LocationType = 'Store'
            WHERE o.AccountId = @AccountId
              AND (@CompanyCode IS NULL OR UPPER(o.CompanyCode) = UPPER(@CompanyCode))
              AND (@Status IS NULL OR UPPER(o.Status) = UPPER(@Status))
              AND (@LocationCode IS NULL OR UPPER(o.LocationCode) = UPPER(@LocationCode))
              AND (@Channel IS NULL OR UPPER(o.Channel) = UPPER(@Channel) OR UPPER(o.Channel) = 'BOTH')
            ORDER BY o.Sequence DESC;";

        var orders = (await db.QueryAsync<OrderDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Status = status, LocationCode = locationCode, Channel = channel },
            cancellationToken: cancellationToken))).ToList();

        if (orders.Count > 0)
        {
            const string itemsSql = @"
                SELECT oi.Sequence, oi.AccountId, oi.CompanyCode, oi.OrderId, oi.ItemNumber, oi.ItemName,
                       oi.ColourCode, oi.SizeCode, oi.Sku, oi.Quantity, oi.UnitPrice, oi.TotalPrice, oi.DateAdded
                FROM dbo.OrderItem AS oi
                WHERE oi.AccountId = @AccountId
                  AND oi.OrderId IN @OrderIds;";

            var orderIds = orders.Select(x => x.OrderId).Distinct().ToList();
            var allItems = (await db.QueryAsync<OrderItemDto>(new CommandDefinition(
                itemsSql,
                new { AccountId = accountId, OrderIds = orderIds },
                cancellationToken: cancellationToken))).ToList();

            var itemsByOrder = allItems.GroupBy(x => $"{x.CompanyCode.ToUpper()}::{x.OrderId.ToUpper()}")
                                       .ToDictionary(g => g.Key, g => g.ToList());

            for (int i = 0; i < orders.Count; i++)
            {
                var key = $"{orders[i].CompanyCode.ToUpper()}::{orders[i].OrderId.ToUpper()}";
                if (itemsByOrder.TryGetValue(key, out var items))
                {
                    orders[i] = orders[i] with { Items = items };
                }
                else
                {
                    orders[i] = orders[i] with { Items = [] };
                }
            }
        }

        return orders;
    }

    public async Task<OrderDto?> GetOrderByIdAsync(string accountId, string companyCode, string orderId, CancellationToken cancellationToken = default)
    {
        var orders = await GetOrdersAsync(accountId, companyCode, cancellationToken: cancellationToken);
        return orders.FirstOrDefault(x => x.OrderId.Equals(orderId, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<bool> ExistsByOrderIdAsync(string accountId, string companyCode, string orderId, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM dbo.Orders
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(OrderId) = UPPER(@OrderId)
            ) THEN 1 ELSE 0 END;";

        return await db.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper() },
            cancellationToken: cancellationToken));
    }

    public async Task<OrderPayload> CreateOrderTransactionAsync(OrderRequest request, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            var subTotal = request.Items.Sum(x => x.Quantity * x.UnitPrice);
            var totalItems = request.Items.Sum(x => x.Quantity);
            var totalAmount = subTotal + request.Tax + request.ShippingCost - request.Discount;
            if (totalAmount < 0) totalAmount = 0;

            const string insertOrderSql = @"
                INSERT INTO dbo.Orders
                (AccountId, CompanyCode, OrderId, ParentOrderId, Channel, LocationType, LocationCode,
                 Status, PaymentStatus, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress,
                 TotalItems, SubTotal, Tax, ShippingCost, Discount, TotalAmount, Notes, OrderDate, DateCreated, CreatedBy,
                 ShipVia, DeliveryPartner, PickupLocationCode, PickupLocationName, ShippingState, PromoCode)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, @ParentOrderId, @Channel, @LocationType, @LocationCode,
                 @Status, @PaymentStatus, @CustomerName, @CustomerEmail, @CustomerPhone, @ShippingAddress,
                 @TotalItems, @SubTotal, @Tax, @ShippingCost, @Discount, @TotalAmount, @Notes, SYSDATETIME(), SYSDATETIME(), @CreatedBy,
                 @ShipVia, @DeliveryPartner, @PickupLocationCode, @PickupLocationName, @ShippingState, @PromoCode);";

            await db.ExecuteAsync(new CommandDefinition(
                insertOrderSql,
                new
                {
                    AccountId = request.AccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    OrderId = request.OrderId.ToUpper(),
                    ParentOrderId = request.ParentOrderId?.ToUpper(),
                    Channel = request.Channel,
                    LocationType = request.LocationType,
                    LocationCode = request.LocationCode.ToUpper(),
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status,
                    PaymentStatus = string.IsNullOrWhiteSpace(request.PaymentStatus) ? "Unpaid" : request.PaymentStatus,
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone,
                    ShippingAddress = request.ShippingAddress,
                    TotalItems = totalItems,
                    SubTotal = subTotal,
                    Tax = request.Tax,
                    ShippingCost = request.ShippingCost,
                    Discount = request.Discount,
                    TotalAmount = totalAmount,
                    Notes = request.Notes,
                    CreatedBy = request.UserName,
                    ShipVia = request.ShipVia,
                    DeliveryPartner = request.DeliveryPartner,
                    PickupLocationCode = request.PickupLocationCode?.ToUpper(),
                    PickupLocationName = request.PickupLocationName,
                    ShippingState = request.ShippingState,
                    PromoCode = request.PromoCode?.ToUpper()
                },
                transaction,
                cancellationToken: cancellationToken));

            if (!string.IsNullOrWhiteSpace(request.PromoCode))
            {
                const string updatePromoSql = @"
                    UPDATE dbo.PromoCode 
                    SET TimesUsed = TimesUsed + 1 
                    WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code);";
                await db.ExecuteAsync(new CommandDefinition(
                    updatePromoSql,
                    new { AccountId = request.AccountId, Code = request.PromoCode.Trim() },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            const string insertItemSql = @"
                INSERT INTO dbo.OrderItem
                (AccountId, CompanyCode, OrderId, ItemNumber, ItemName, ColourCode, SizeCode, Sku, Quantity, UnitPrice, TotalPrice, DateAdded)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, @ItemNumber, @ItemName, @ColourCode, @SizeCode, @Sku, @Quantity, @UnitPrice, @TotalPrice, SYSDATETIME());";

            foreach (var itm in request.Items)
            {
                var itemTotal = itm.Quantity * itm.UnitPrice;
                await db.ExecuteAsync(new CommandDefinition(
                    insertItemSql,
                    new
                    {
                        AccountId = request.AccountId,
                        CompanyCode = request.CompanyCode.ToUpper(),
                        OrderId = request.OrderId.ToUpper(),
                        ItemNumber = itm.ItemNumber.ToUpper(),
                        ItemName = itm.ItemName,
                        ColourCode = itm.ColourCode,
                        SizeCode = string.IsNullOrWhiteSpace(itm.SizeCode) ? "ALL" : itm.SizeCode.ToUpper(),
                        Sku = itm.Sku,
                        Quantity = itm.Quantity,
                        UnitPrice = itm.UnitPrice,
                        TotalPrice = itemTotal
                    },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            transaction.Commit();

            return new OrderPayload
            {
                Success = true,
                Message = $"Order [{request.OrderId}] created successfully.",
                SegregatedOrderIds = [request.OrderId]
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new OrderPayload { Success = false, Message = $"Failed to create order: {ex.Message}" };
        }
    }

    public async Task<OrderPayload> CreateBatchOrdersTransactionAsync(List<OrderRequest> requests, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            var createdIds = new List<string>();

            const string insertOrderSql = @"
                INSERT INTO dbo.Orders
                (AccountId, CompanyCode, OrderId, ParentOrderId, Channel, LocationType, LocationCode,
                 Status, PaymentStatus, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress,
                 TotalItems, SubTotal, Tax, ShippingCost, Discount, TotalAmount, Notes, OrderDate, DateCreated, CreatedBy,
                 ShipVia, DeliveryPartner, PickupLocationCode, PickupLocationName, ShippingState, PromoCode)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, @ParentOrderId, @Channel, @LocationType, @LocationCode,
                 @Status, @PaymentStatus, @CustomerName, @CustomerEmail, @CustomerPhone, @ShippingAddress,
                 @TotalItems, @SubTotal, @Tax, @ShippingCost, @Discount, @TotalAmount, @Notes, SYSDATETIME(), SYSDATETIME(), @CreatedBy,
                 @ShipVia, @DeliveryPartner, @PickupLocationCode, @PickupLocationName, @ShippingState, @PromoCode);";

            const string insertItemSql = @"
                INSERT INTO dbo.OrderItem
                (AccountId, CompanyCode, OrderId, ItemNumber, ItemName, ColourCode, SizeCode, Sku, Quantity, UnitPrice, TotalPrice, DateAdded)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, @ItemNumber, @ItemName, @ColourCode, @SizeCode, @Sku, @Quantity, @UnitPrice, @TotalPrice, SYSDATETIME());";

            foreach (var req in requests)
            {
                var subTotal = req.Items.Sum(x => x.Quantity * x.UnitPrice);
                var totalItems = req.Items.Sum(x => x.Quantity);
                var totalAmount = subTotal + req.Tax + req.ShippingCost - req.Discount;
                if (totalAmount < 0) totalAmount = 0;

                await db.ExecuteAsync(new CommandDefinition(
                    insertOrderSql,
                    new
                    {
                        AccountId = req.AccountId,
                        CompanyCode = req.CompanyCode.ToUpper(),
                        OrderId = req.OrderId.ToUpper(),
                        ParentOrderId = req.ParentOrderId?.ToUpper(),
                        Channel = req.Channel,
                        LocationType = req.LocationType,
                        LocationCode = req.LocationCode.ToUpper(),
                        Status = string.IsNullOrWhiteSpace(req.Status) ? "Pending" : req.Status,
                        PaymentStatus = string.IsNullOrWhiteSpace(req.PaymentStatus) ? "Unpaid" : req.PaymentStatus,
                        CustomerName = req.CustomerName,
                        CustomerEmail = req.CustomerEmail,
                        CustomerPhone = req.CustomerPhone,
                        ShippingAddress = req.ShippingAddress,
                        TotalItems = totalItems,
                        SubTotal = subTotal,
                        Tax = req.Tax,
                        ShippingCost = req.ShippingCost,
                        Discount = req.Discount,
                        TotalAmount = totalAmount,
                        Notes = req.Notes,
                        CreatedBy = req.UserName,
                        ShipVia = req.ShipVia,
                        DeliveryPartner = req.DeliveryPartner,
                        PickupLocationCode = req.PickupLocationCode?.ToUpper(),
                        PickupLocationName = req.PickupLocationName,
                        ShippingState = req.ShippingState,
                        PromoCode = req.PromoCode?.ToUpper()
                    },
                    transaction,
                    cancellationToken: cancellationToken));

                if (!string.IsNullOrWhiteSpace(req.PromoCode))
                {
                    const string updatePromoSql = @"
                        UPDATE dbo.PromoCode 
                        SET TimesUsed = TimesUsed + 1 
                        WHERE AccountId = @AccountId AND UPPER(Code) = UPPER(@Code);";
                    await db.ExecuteAsync(new CommandDefinition(
                        updatePromoSql,
                        new { AccountId = req.AccountId, Code = req.PromoCode.Trim() },
                        transaction,
                        cancellationToken: cancellationToken));
                }

                foreach (var itm in req.Items)
                {
                    var itemTotal = itm.Quantity * itm.UnitPrice;
                    await db.ExecuteAsync(new CommandDefinition(
                        insertItemSql,
                        new
                        {
                            AccountId = req.AccountId,
                            CompanyCode = req.CompanyCode.ToUpper(),
                            OrderId = req.OrderId.ToUpper(),
                            ItemNumber = itm.ItemNumber.ToUpper(),
                            ItemName = itm.ItemName,
                            ColourCode = itm.ColourCode,
                            SizeCode = string.IsNullOrWhiteSpace(itm.SizeCode) ? "ALL" : itm.SizeCode.ToUpper(),
                            Sku = itm.Sku,
                            Quantity = itm.Quantity,
                            UnitPrice = itm.UnitPrice,
                            TotalPrice = itemTotal
                        },
                        transaction,
                        cancellationToken: cancellationToken));
                }

                createdIds.Add(req.OrderId);
            }

            transaction.Commit();

            return new OrderPayload
            {
                Success = true,
                Message = $"Successfully created {createdIds.Count} segregated orders.",
                SegregatedOrderIds = createdIds
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new OrderPayload { Success = false, Message = $"Failed to create batch orders: {ex.Message}" };
        }
    }

    public async Task<OrderPayload> UpdateOrderStatusAsync(string accountId, string companyCode, string orderId, string status, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            UPDATE dbo.Orders
            SET Status = @Status
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper(), Status = status },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new OrderPayload { Success = true, Message = $"Order [{orderId}] status updated to '{status}'." };
        }

        return new OrderPayload { Success = false, Message = $"Order [{orderId}] could not be found." };
    }

    public async Task<OrderPayload> DeleteOrderAsync(string accountId, string companyCode, string orderId, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            DELETE FROM dbo.Orders
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper() },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new OrderPayload { Success = true, Message = $"Order [{orderId}] deleted successfully." };
        }

        return new OrderPayload { Success = false, Message = $"Order [{orderId}] could not be found." };
    }
}
