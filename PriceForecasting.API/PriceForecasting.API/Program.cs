global using PriceForecasting.Data.Context;

using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PriceForecasting.Core.Services;
using Microsoft.EntityFrameworkCore.Sqlite;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "PriceForecasting API", Version = "v1" });
});

// DbContext - SQLite для локальной разработки
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// Добавляем MemoryCache (для кеширования рекомендаций 6 часов)
builder.Services.AddMemoryCache();

// Регистрируем ML сервис
builder.Services.AddHttpClient<IMlService, MlService>();
builder.Services.AddScoped<IMlService, MlService>();

// Добавляем CORS для фронтенда
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Временно отключаем инициализацию базы данных для диагностики
/*
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated(); // Создать базу данных если не существует
        SeedData.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB: {Error}", ex.Message);
    }
}
*/

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Порт для Railway
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://0.0.0.0:{port}");
Console.WriteLine($" Server starting on port {port}");

app.Run();
