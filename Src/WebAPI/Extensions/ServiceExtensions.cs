using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using Application.Services;
using Infrastructure.Repositories;
using Infrastructure.Tenant;

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
        services.AddScoped<ITenantResolver, TenantResolver>();
        // Application Level Dependencies ends...

        /***************************************************************************************************************/

        // GraphQL Service Dependencies starts...
        services.AddScoped<IRegisterationService, RegisterationService>();
        services.AddScoped<ICountryFetchService, CountryFetchService>();
        services.AddScoped<ICredentialsVerificationService, CredentialsVerificationService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        // GraphQL Service Dependencies ends...

        /***************************************************************************************************************/

        // Data Layer Dependencies starts...
        services.AddScoped<IAuthenticationRepository, AuthenticationRepository>();
        services.AddScoped<ISchemaRepository, SchemaRepository>();
        services.AddScoped<ICountryRepository, CountryRepository>();
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