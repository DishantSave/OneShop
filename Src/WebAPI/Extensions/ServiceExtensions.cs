using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using Application.Services;
using Application.Services.Masters;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Masters;
using Infrastructure.Tenant;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebAPI.Authentication;

namespace WebAPI.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection RegisterDependency(this IServiceCollection services)
    {
        // Application Level Dependencies starts...
        services.AddHttpContextAccessor();
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAngularClient", policy =>
            {
                policy.WithOrigins("http://localhost:4200") // Allow your Angular frontend origin
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ITenantResolver, TenantResolver>();
        // Application Level Dependencies ends...

        /***************************************************************************************************************/

        // GraphQL Service Dependencies starts...
        services.AddScoped<IRegisterationService, RegisterationService>();
        services.AddScoped<ICountryFetchService, CountryFetchService>();
        services.AddScoped<ICredentialsVerificationService, CredentialsVerificationService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IStoreService, StoreService>();
        services.AddScoped<ISubAccountService, SubAccountService>();
        services.AddScoped<IWarehouseService, WarehouseService>();
        services.AddScoped<IColourService, ColourService>();
        services.AddScoped<ISizeService, SizeService>();
        services.AddScoped<IItemService, Application.Services.Catalog.ItemService>();
        services.AddScoped<ICollectionService, Application.Services.Catalog.CollectionService>();
        services.AddScoped<IInventoryService, Application.Services.Inventory.InventoryService>();
        services.AddScoped<IOrderService, Application.Services.Order.OrderService>();
        services.AddScoped<IStateTaxService, Application.Services.Tax.StateTaxService>();
        services.AddScoped<IPromoCodeService, Application.Services.Discounts.PromoCodeService>();
        services.AddScoped<IUserAddressService, Application.Services.Address.UserAddressService>();
        
        // GraphQL Service Dependencies ends...

        /***************************************************************************************************************/

        // Data Layer Dependencies starts...
        services.AddScoped<IAuthenticationRepository, AuthenticationRepository>();
        services.AddScoped<ISchemaRepository, SchemaRepository>();
        services.AddScoped<ICountryRepository, CountryRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IStoreRepository, StoreRepository>();
        services.AddScoped<ISubAccountRepository, SubAccountRepository>();
        services.AddScoped<IWarehouseRepository, WarehouseRepository>();
        services.AddScoped<IColourRepository, ColourRepository>();
        services.AddScoped<ISizeRepository, SizeRepository>();
        services.AddScoped<IItemRepository, Infrastructure.Repositories.Catalog.ItemRepository>();
        services.AddScoped<ICollectionRepository, Infrastructure.Repositories.Catalog.CollectionRepository>();
        services.AddScoped<IInventoryRepository, Infrastructure.Repositories.Inventory.InventoryRepository>();
        services.AddScoped<IOrderRepository, Infrastructure.Repositories.Order.OrderRepository>();
        services.AddScoped<IStateTaxRepository, Infrastructure.Repositories.Masters.StateTaxRepository>();
        services.AddScoped<IPromoCodeRepository, Infrastructure.Repositories.Discounts.PromoCodeRepository>();
        services.AddScoped<IUserAddressRepository, Infrastructure.Repositories.Address.UserAddressRepository>();
        // Data Layer Dependencies ends...

        /***************************************************************************************************************/
        /*
        // Data Helpers Dependencies starts...
        builder.Services.AddScoped<ICommonDataHelper, CommonDataHelper>();
        builder.Services.AddScoped<IRegisterUserDataHelper, RegisterUserDataHelper>();
        builder.Services.AddScoped<IAuthenticationDataHelper, AuthenticationDataHelper>();
        // Data Helpers Dependencies ends...
        */

        return services;
    }
}