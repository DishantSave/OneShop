using WebAPI.Extensions;
using WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .RegisterDependency()
    .AddAuthorization()
    .AddGraphQLServer()
    .AddAuthorization()
    .RegisterQueryTypes()
    .RegisterMutationTypes();

builder.AddAuthentication();

var app = builder.Build();

//app.UseCors("AllowLocalhost");
app.UseCors("AllowAngularClient");

app.UseAuthentication();
app.UseAuthorization();


app.UseMiddleware<TenantMiddleware>();

app.MapGraphQL();

app.Run();