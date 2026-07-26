using WebAPI.Extensions;
using WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .RegisterDependency()
    .AddGraphQLServer()
    .RegisterQueryTypes()
    .RegisterMutationTypes();

var app = builder.Build();

//app.UseCors("AllowLocalhost");
app.UseCors("AllowAngularClient");

app.UseMiddleware<TenantMiddleware>();

app.MapGraphQL();

app.Run();