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

// Swagger (enabled in all environments)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "HerdFlow API v1");
});

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
    db.Database.Migrate();
}
app.Run();
