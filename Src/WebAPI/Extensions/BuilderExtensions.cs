using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace WebAPI.Extensions;

public static class BuilderExtensions
{
    public static WebApplicationBuilder AddAuthentication(this WebApplicationBuilder builder)
    {
        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,

                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],

                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration["Jwt:SecretKey"]!))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (context.Request.Headers.TryGetValue("X-API-Key", out var apiKey) && !string.IsNullOrWhiteSpace(apiKey))
                        {
                            context.Token = apiKey.ToString().Trim();
                        }
                        return Task.CompletedTask;
                    },

                    OnAuthenticationFailed = context =>
                    {
                        return Task.CompletedTask;
                    },

                    OnTokenValidated = context =>
                    {
                        return Task.CompletedTask;
                    }
                };
            });

        return builder;
    }
}