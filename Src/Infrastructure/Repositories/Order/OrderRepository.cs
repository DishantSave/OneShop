using Application.Common.Tenant;
using Application.DTOs.Order;
using Application.GraphQL.InputModels;
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

    public async Task<IEnumerable<OrderDto>> GetOrdersAsync(string accountId, string? companyCode = null, string? status = null, string? locationCode = null, string? channel = null, string? createdBy = null, bool isCustomer = false, CancellationToken cancellationToken = default)
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
            WHERE (@IsCustomer = 0 AND o.AccountId = @AccountId OR @IsCustomer = 1)
              AND (@CompanyCode IS NULL OR UPPER(o.CompanyCode) = UPPER(@CompanyCode))
              AND (@Status IS NULL OR UPPER(o.Status) = UPPER(@Status))
              AND (@LocationCode IS NULL OR UPPER(o.LocationCode) = UPPER(@LocationCode))
              AND (@Channel IS NULL OR UPPER(o.Channel) = UPPER(@Channel) OR UPPER(o.Channel) = 'BOTH')
              AND (@CreatedBy IS NULL OR UPPER(o.CreatedBy) = UPPER(@CreatedBy) OR (o.CustomerEmail IS NOT NULL AND UPPER(o.CustomerEmail) = UPPER(@CreatedBy)))
            ORDER BY o.Sequence DESC;";

        var orders = (await db.QueryAsync<OrderDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode, Status = status, LocationCode = locationCode, Channel = channel, CreatedBy = createdBy, IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken))).ToList();

        if (orders.Count > 0)
        {
            const string itemsSql = @"
                SELECT oi.Sequence, oi.AccountId, oi.CompanyCode, oi.OrderId, oi.ItemNumber, oi.ItemName,
                       oi.ColourCode, oi.SizeCode, oi.Sku, oi.Quantity, oi.UnitPrice, oi.TotalPrice, oi.DateAdded
                FROM dbo.OrderItem AS oi
                WHERE (@IsCustomer = 0 AND oi.AccountId = @AccountId OR @IsCustomer = 1)
                  AND oi.OrderId IN @OrderIds;";

            var orderIds = orders.Select(x => x.OrderId).Distinct().ToList();
            var allItems = (await db.QueryAsync<OrderItemDto>(new CommandDefinition(
                itemsSql,
                new { AccountId = accountId, OrderIds = orderIds, IsCustomer = isCustomer ? 1 : 0 },
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

    public async Task<OrderDto?> GetOrderByIdAsync(string accountId, string companyCode, string orderId, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        var orders = await GetOrdersAsync(accountId, companyCode, isCustomer: isCustomer, cancellationToken: cancellationToken);
        var order = orders.FirstOrDefault(x => x.OrderId.Equals(orderId, StringComparison.OrdinalIgnoreCase));
        if (order != null)
        {
            var audit = (await GetOrderAuditTrailAsync(accountId, companyCode, orderId, isCustomer: isCustomer, cancellationToken: cancellationToken)).ToList();
            return order with { AuditTrail = audit };
        }
        return null;
    }

    public async Task<IEnumerable<OrderAuditTrailDto>> GetOrderAuditTrailAsync(string accountId, string companyCode, string orderId, bool isCustomer = false, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());
        const string sql = @"
            SELECT Sequence, AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole
            FROM dbo.OrderAuditTrail
            WHERE (@IsCustomer = 0 AND AccountId = @AccountId OR @IsCustomer = 1)
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId)
            ORDER BY DateModified DESC, Sequence DESC;";

        return await db.QueryAsync<OrderAuditTrailDto>(new CommandDefinition(
            sql,
            new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper(), IsCustomer = isCustomer ? 1 : 0 },
            cancellationToken: cancellationToken));
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
            const string getCompanyOwnerSql = @"
                SELECT TOP 1 AccountId 
                FROM dbo.Company 
                WHERE UPPER(Code) = UPPER(@CompanyCode)
                ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

            var targetAccountId = await db.ExecuteScalarAsync<string>(new CommandDefinition(
                getCompanyOwnerSql,
                new { CompanyCode = request.CompanyCode.ToUpper(), AccountId = request.AccountId },
                transaction,
                cancellationToken: cancellationToken)) ?? request.AccountId;

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
                    AccountId = targetAccountId,
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
                    new { AccountId = targetAccountId, Code = request.PromoCode.Trim() },
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
                        AccountId = targetAccountId,
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

            const string insertAuditSql = @"
                INSERT INTO dbo.OrderAuditTrail
                (AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, @ActionType, @Field, @OldValue, @NewValue, @Description, SYSDATETIME(), @ModifiedBy, @UserRole);";

            await db.ExecuteAsync(new CommandDefinition(
                insertAuditSql,
                new
                {
                    AccountId = targetAccountId,
                    CompanyCode = request.CompanyCode.ToUpper(),
                    OrderId = request.OrderId.ToUpper(),
                    ActionType = "Created",
                    Field = "Status",
                    OldValue = (string?)null,
                    NewValue = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status,
                    Description = $"Order placed via {request.Channel} for {request.LocationCode}. Total units: {totalItems}, Net total: ${totalAmount:F2}.",
                    ModifiedBy = request.UserName,
                    UserRole = "User"
                },
                transaction,
                cancellationToken: cancellationToken));

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
                const string getCompanyOwnerSql = @"
                    SELECT TOP 1 AccountId 
                    FROM dbo.Company 
                    WHERE UPPER(Code) = UPPER(@CompanyCode)
                    ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

                var targetAccountId = await db.ExecuteScalarAsync<string>(new CommandDefinition(
                    getCompanyOwnerSql,
                    new { CompanyCode = req.CompanyCode.ToUpper(), AccountId = req.AccountId },
                    transaction,
                    cancellationToken: cancellationToken)) ?? req.AccountId;

                var subTotal = req.Items.Sum(x => x.Quantity * x.UnitPrice);
                var totalItems = req.Items.Sum(x => x.Quantity);
                var totalAmount = subTotal + req.Tax + req.ShippingCost - req.Discount;
                if (totalAmount < 0) totalAmount = 0;

                await db.ExecuteAsync(new CommandDefinition(
                    insertOrderSql,
                    new
                    {
                        AccountId = targetAccountId,
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
                        new { AccountId = targetAccountId, Code = req.PromoCode.Trim() },
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
                            AccountId = targetAccountId,
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

                const string insertAuditSql = @"
                    INSERT INTO dbo.OrderAuditTrail
                    (AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole)
                    VALUES
                    (@AccountId, @CompanyCode, @OrderId, @ActionType, @Field, @OldValue, @NewValue, @Description, SYSDATETIME(), @ModifiedBy, @UserRole);";

                await db.ExecuteAsync(new CommandDefinition(
                    insertAuditSql,
                    new
                    {
                        AccountId = targetAccountId,
                        CompanyCode = req.CompanyCode.ToUpper(),
                        OrderId = req.OrderId.ToUpper(),
                        ActionType = "Created",
                        Field = "Status",
                        OldValue = (string?)null,
                        NewValue = string.IsNullOrWhiteSpace(req.Status) ? "Pending" : req.Status,
                        Description = $"Segregated batch order placed via {req.Channel} for {req.LocationCode}. Total units: {totalItems}, Net total: ${totalAmount:F2}.",
                        ModifiedBy = req.UserName,
                        UserRole = "User"
                    },
                    transaction,
                    cancellationToken: cancellationToken));

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

    public async Task<OrderPayload> UpdateOrderStatusAsync(string accountId, string companyCode, string orderId, string status, string userName, string? userRole = null, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string getStatusSql = @"
                SELECT TOP 1 Status, AccountId
                FROM dbo.Orders
                WHERE (AccountId = @AccountId OR @AccountId IS NOT NULL)
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(OrderId) = UPPER(@OrderId)
                ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

            var existing = await db.QueryFirstOrDefaultAsync<dynamic>(new CommandDefinition(
                getStatusSql,
                new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper() },
                transaction,
                cancellationToken: cancellationToken));

            if (existing == null)
            {
                transaction.Rollback();
                return new OrderPayload { Success = false, Message = $"Order [{orderId}] could not be found." };
            }

            string currentStatus = (string)existing.Status;
            string targetAccountId = (string)existing.AccountId;

            if (string.Equals(currentStatus, status, StringComparison.OrdinalIgnoreCase))
            {
                transaction.Rollback();
                return new OrderPayload { Success = true, Message = $"Order [{orderId}] is already in '{status}' status." };
            }

            const string sql = @"
                UPDATE dbo.Orders
                SET Status = @Status
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(OrderId) = UPPER(@OrderId);";

            await db.ExecuteAsync(new CommandDefinition(
                sql,
                new { AccountId = targetAccountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper(), Status = status },
                transaction,
                cancellationToken: cancellationToken));

            const string insertAuditSql = @"
                INSERT INTO dbo.OrderAuditTrail
                (AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, 'StatusChanged', 'Status', @OldValue, @NewValue, @Description, SYSDATETIME(), @ModifiedBy, @UserRole);";

            await db.ExecuteAsync(new CommandDefinition(
                insertAuditSql,
                new
                {
                    AccountId = targetAccountId,
                    CompanyCode = companyCode.ToUpper(),
                    OrderId = orderId.ToUpper(),
                    OldValue = currentStatus,
                    NewValue = status,
                    Description = $"Order status transitioned from '{currentStatus}' to '{status}'.",
                    ModifiedBy = userName,
                    UserRole = userRole ?? "Support"
                },
                transaction,
                cancellationToken: cancellationToken));

            transaction.Commit();

            return new OrderPayload { Success = true, Message = $"Order [{orderId}] status updated to '{status}'." };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new OrderPayload { Success = false, Message = $"Failed to update order status: {ex.Message}" };
        }
    }

    public async Task<OrderPayload> UpdateOrderDetailsAsync(string accountId, UpdateOrderDetailsInput input, string userName, CancellationToken cancellationToken = default)
    {
        using var db = new SqlConnection(GetConnectionString());
        await db.OpenAsync(cancellationToken);
        using var transaction = db.BeginTransaction();

        try
        {
            const string getOrderSql = @"
                SELECT TOP 1 AccountId, Status, CustomerName, CustomerEmail, CustomerPhone, ShippingAddress, ShippingState, ShipVia, DeliveryPartner, PickupLocationCode, PickupLocationName, Notes
                FROM dbo.Orders
                WHERE (AccountId = @AccountId OR @AccountId IS NOT NULL)
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(OrderId) = UPPER(@OrderId)
                ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

            var existing = await db.QueryFirstOrDefaultAsync<dynamic>(new CommandDefinition(
                getOrderSql,
                new { AccountId = accountId, CompanyCode = input.CompanyCode.ToUpper(), OrderId = input.OrderId.ToUpper() },
                transaction,
                cancellationToken: cancellationToken));

            if (existing == null)
            {
                transaction.Rollback();
                return new OrderPayload { Success = false, Message = $"Order [{input.OrderId}] was not found." };
            }

            string targetAccountId = (string)existing.AccountId;
            string currentStatus = (string)existing.Status ?? "Pending";
            if (string.Equals(currentStatus, "Shipped", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(currentStatus, "Delivered", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(currentStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                transaction.Rollback();
                return new OrderPayload
                {
                    Success = false,
                    Message = $"Order [{input.OrderId}] is in '{currentStatus}' status and cannot be modified. Shipped, completed, and cancelled orders are locked."
                };
            }

            var changes = new List<(string Field, string? OldVal, string? NewVal)>();

            string? oldName = (string?)existing.CustomerName;
            string? newName = input.CustomerName ?? oldName;
            if (input.CustomerName != null && !string.Equals(oldName, input.CustomerName))
                changes.Add(("CustomerName", oldName, input.CustomerName));

            string? oldEmail = (string?)existing.CustomerEmail;
            string? newEmail = input.CustomerEmail ?? oldEmail;
            if (input.CustomerEmail != null && !string.Equals(oldEmail, input.CustomerEmail))
                changes.Add(("CustomerEmail", oldEmail, input.CustomerEmail));

            string? oldPhone = (string?)existing.CustomerPhone;
            string? newPhone = input.CustomerPhone ?? oldPhone;
            if (input.CustomerPhone != null && !string.Equals(oldPhone, input.CustomerPhone))
                changes.Add(("CustomerPhone", oldPhone, input.CustomerPhone));

            string? oldAddress = (string?)existing.ShippingAddress;
            string? newAddress = input.ShippingAddress ?? oldAddress;
            if (input.ShippingAddress != null && !string.Equals(oldAddress, input.ShippingAddress))
                changes.Add(("ShippingAddress", oldAddress, input.ShippingAddress));

            string? oldState = (string?)existing.ShippingState;
            string? newState = input.ShippingState ?? oldState;
            if (input.ShippingState != null && !string.Equals(oldState, input.ShippingState))
                changes.Add(("ShippingState", oldState, input.ShippingState));

            string? oldShipVia = (string?)existing.ShipVia;
            string? newShipVia = input.ShipVia ?? oldShipVia;
            if (input.ShipVia != null && !string.Equals(oldShipVia, input.ShipVia))
                changes.Add(("ShipVia", oldShipVia, input.ShipVia));

            string? oldPartner = (string?)existing.DeliveryPartner;
            string? newPartner = input.DeliveryPartner ?? oldPartner;
            if (input.DeliveryPartner != null && !string.Equals(oldPartner, input.DeliveryPartner))
                changes.Add(("DeliveryPartner", oldPartner, input.DeliveryPartner));

            string? oldPickupCode = (string?)existing.PickupLocationCode;
            string? newPickupCode = input.PickupLocationCode ?? oldPickupCode;
            if (input.PickupLocationCode != null && !string.Equals(oldPickupCode, input.PickupLocationCode))
                changes.Add(("PickupLocationCode", oldPickupCode, input.PickupLocationCode));

            string? oldPickupName = (string?)existing.PickupLocationName;
            string? newPickupName = input.PickupLocationName ?? oldPickupName;
            if (input.PickupLocationName != null && !string.Equals(oldPickupName, input.PickupLocationName))
                changes.Add(("PickupLocationName", oldPickupName, input.PickupLocationName));

            string? oldNotes = (string?)existing.Notes;
            string? newNotes = input.Notes ?? oldNotes;
            if (input.Notes != null && !string.Equals(oldNotes, input.Notes))
                changes.Add(("Notes", oldNotes, input.Notes));

            if (changes.Count == 0)
            {
                transaction.Rollback();
                return new OrderPayload { Success = true, Message = "No changes were detected." };
            }

            const string updateSql = @"
                UPDATE dbo.Orders
                SET CustomerName = @CustomerName,
                    CustomerEmail = @CustomerEmail,
                    CustomerPhone = @CustomerPhone,
                    ShippingAddress = @ShippingAddress,
                    ShippingState = @ShippingState,
                    ShipVia = @ShipVia,
                    DeliveryPartner = @DeliveryPartner,
                    PickupLocationCode = @PickupLocationCode,
                    PickupLocationName = @PickupLocationName,
                    Notes = @Notes
                WHERE AccountId = @AccountId
                  AND UPPER(CompanyCode) = UPPER(@CompanyCode)
                  AND UPPER(OrderId) = UPPER(@OrderId);";

            await db.ExecuteAsync(new CommandDefinition(
                updateSql,
                new
                {
                    AccountId = targetAccountId,
                    CompanyCode = input.CompanyCode.ToUpper(),
                    OrderId = input.OrderId.ToUpper(),
                    CustomerName = newName,
                    CustomerEmail = newEmail,
                    CustomerPhone = newPhone,
                    ShippingAddress = newAddress,
                    ShippingState = newState,
                    ShipVia = newShipVia,
                    DeliveryPartner = newPartner,
                    PickupLocationCode = newPickupCode,
                    PickupLocationName = newPickupName,
                    Notes = newNotes
                },
                transaction,
                cancellationToken: cancellationToken));

            const string insertAuditSql = @"
                INSERT INTO dbo.OrderAuditTrail
                (AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole)
                VALUES
                (@AccountId, @CompanyCode, @OrderId, 'DetailsUpdated', @Field, @OldValue, @NewValue, @Description, SYSDATETIME(), @ModifiedBy, @UserRole);";

            foreach (var chg in changes)
            {
                await db.ExecuteAsync(new CommandDefinition(
                    insertAuditSql,
                    new
                    {
                        AccountId = targetAccountId,
                        CompanyCode = input.CompanyCode.ToUpper(),
                        OrderId = input.OrderId.ToUpper(),
                        Field = chg.Field,
                        OldValue = chg.OldVal,
                        NewValue = chg.NewVal,
                        Description = $"Updated {chg.Field}: '{chg.OldVal ?? "none"}' -> '{chg.NewVal}'.",
                        ModifiedBy = userName,
                        UserRole = input.UserRole ?? "Support"
                    },
                    transaction,
                    cancellationToken: cancellationToken));
            }

            transaction.Commit();

            return new OrderPayload
            {
                Success = true,
                Message = $"Order [{input.OrderId}] details updated successfully ({changes.Count} field(s) changed)."
            };
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return new OrderPayload { Success = false, Message = $"Failed to update order details: {ex.Message}" };
        }
    }

    public async Task<OrderPayload> AddOrderTimelineCommentAsync(string accountId, AddOrderTimelineCommentInput input, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(input.Comment))
        {
            return new OrderPayload { Success = false, Message = "Comment cannot be empty." };
        }

        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string getOwnerSql = @"
            SELECT TOP 1 AccountId
            FROM dbo.Orders
            WHERE (AccountId = @AccountId OR @AccountId IS NOT NULL)
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId)
            ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

        var targetAccountId = await db.ExecuteScalarAsync<string>(new CommandDefinition(
            getOwnerSql,
            new { AccountId = accountId, CompanyCode = input.CompanyCode.ToUpper(), OrderId = input.OrderId.ToUpper() },
            cancellationToken: cancellationToken)) ?? accountId;

        const string insertAuditSql = @"
            INSERT INTO dbo.OrderAuditTrail
            (AccountId, CompanyCode, OrderId, ActionType, Field, OldValue, NewValue, Description, DateModified, ModifiedBy, UserRole)
            VALUES
            (@AccountId, @CompanyCode, @OrderId, 'CommentAdded', 'Timeline', NULL, NULL, @Description, SYSDATETIME(), @ModifiedBy, @UserRole);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            insertAuditSql,
            new
            {
                AccountId = targetAccountId,
                CompanyCode = input.CompanyCode.ToUpper(),
                OrderId = input.OrderId.ToUpper(),
                Description = input.Comment.Trim(),
                ModifiedBy = userName,
                UserRole = input.UserRole ?? "Support"
            },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new OrderPayload { Success = true, Message = "Timeline comment added successfully." };
        }

        return new OrderPayload { Success = false, Message = "Failed to add timeline comment." };
    }

    public async Task<OrderPayload> DeleteOrderAsync(string accountId, string companyCode, string orderId, string userName, CancellationToken cancellationToken = default)
    {
        using IDbConnection db = new SqlConnection(GetConnectionString());

        const string getOwnerSql = @"
            SELECT TOP 1 AccountId
            FROM dbo.Orders
            WHERE (AccountId = @AccountId OR @AccountId IS NOT NULL)
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId)
            ORDER BY CASE WHEN AccountId = @AccountId THEN 0 ELSE 1 END;";

        var targetAccountId = await db.ExecuteScalarAsync<string>(new CommandDefinition(
            getOwnerSql,
            new { AccountId = accountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper() },
            cancellationToken: cancellationToken)) ?? accountId;

        const string sql = @"
            DELETE FROM dbo.Orders
            WHERE AccountId = @AccountId
              AND UPPER(CompanyCode) = UPPER(@CompanyCode)
              AND UPPER(OrderId) = UPPER(@OrderId);";

        var affected = await db.ExecuteAsync(new CommandDefinition(
            sql,
            new { AccountId = targetAccountId, CompanyCode = companyCode.ToUpper(), OrderId = orderId.ToUpper() },
            cancellationToken: cancellationToken));

        if (affected > 0)
        {
            return new OrderPayload { Success = true, Message = $"Order [{orderId}] deleted successfully." };
        }

        return new OrderPayload { Success = false, Message = $"Order [{orderId}] could not be found." };
    }
}
