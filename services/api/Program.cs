using HerdFlow.Api.Data;
using HerdFlow.Api.Development;
using HerdFlow.Api.Middleware;
using HerdFlow.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DotNetEnv;
using System.Security.Claims;
var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    Env.Load();
}

builder.Configuration.AddEnvironmentVariables();
// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();
builder.Services.AddAuthorization();

builder.Services.AddScoped<CowService>();
builder.Services.AddScoped<ActivityLogService>();
builder.Services.AddScoped<CowChangeLogService>();
builder.Services.AddScoped<NoteService>();
builder.Services.AddScoped<WorkdayService>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var supabaseUrl = builder.Configuration["Supabase:Url"];
var authBypassEnabled = builder.Configuration.GetValue<bool>("Auth:BypassEnabled");

if (string.IsNullOrWhiteSpace(supabaseUrl))
{
    throw new InvalidOperationException("Supabase:Url is not configured.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, o =>
    {
        o.EnableRetryOnFailure();
    }));

if (builder.Environment.IsDevelopment() && authBypassEnabled)
{
    builder.Services.AddAuthentication(DevAuthHandler.SchemeName)
        .AddScheme<AuthenticationSchemeOptions, DevAuthHandler>(
            DevAuthHandler.SchemeName,
            _ => { }
        );
}
else
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"{supabaseUrl.TrimEnd('/')}/auth/v1";

            options.RequireHttpsMetadata = false;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"{supabaseUrl.TrimEnd('/')}/auth/v1",

                ValidateAudience = true,
                ValidAudience = "authenticated",

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                NameClaimType = "sub",

                ClockSkew = TimeSpan.Zero
            };

            // Temporary debug logging.
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearer");

                    logger.LogWarning(
                        context.Exception,
                        "JWT authentication failed for {Path}.",
                        context.HttpContext.Request.Path);
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearer");
                    var userId = context.Principal?.FindFirstValue("sub")
                        ?? context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? "<missing>";
                    var claimTypes = context.Principal is null
                        ? "<no principal>"
                        : string.Join(", ", context.Principal.Claims.Select(claim => claim.Type));

                    logger.LogWarning(
                        "Temporary JWT auth debug: path={Path}, tokenUserId={TokenUserId}, claimTypes={ClaimTypes}",
                        context.HttpContext.Request.Path,
                        userId,
                        claimTypes);

                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearer");

                    logger.LogWarning(
                        "JWT challenge for {Path}: error={Error}, description={ErrorDescription}",
                        context.HttpContext.Request.Path,
                        context.Error ?? "<none>",
                        context.ErrorDescription ?? "<none>");

                    return Task.CompletedTask;
                }
            };
        });
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

// Order matters
app.UseRouting();

app.UseCors("AllowFrontend");

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

// Swagger (only in development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "HerdFlow API v1");
    });
}

// Only redirect HTTPS locally (Render handles TLS)
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Map controllers LAST
app.MapControllers();

app.Run();

public partial class Program { }
