using HerdFlow.Api.Data;
using HerdFlow.Api.Development;
using HerdFlow.Api.Middleware;
using HerdFlow.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"{supabaseUrl.TrimEnd('/')}/auth/v1",
                ValidateAudience = true,
                ValidAudience = "authenticated",
                ValidateLifetime = true,
            };
        });
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            var allowedOrigins = builder.Configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>();

            policy
                .WithOrigins(allowedOrigins ?? ["http://localhost:5173"])
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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await Task.Delay(2000);
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration failed: {ex.Message}");
    }
}
app.Run();
