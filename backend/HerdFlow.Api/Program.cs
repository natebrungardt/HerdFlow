using HerdFlow.Api.Data;
using HerdFlow.Api.Middleware;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddScoped<CowService>();
builder.Services.AddScoped<ActivityLogService>();
builder.Services.AddScoped<CowChangeLogService>();
builder.Services.AddScoped<NoteService>();
builder.Services.AddScoped<WorkdayService>();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "https://herdflow.vercel.app",
                    "http://localhost:5173"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("AllowFrontend");

app.UseRouting();

// Enable Swagger in all environments (including production on Render)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "HerdFlow API v1");
});

// Keep HTTPS redirection only for local/dev (Render terminates TLS upstream)
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.MapControllers();
app.Urls.Add("http://0.0.0.0:8080");
app.Run();
