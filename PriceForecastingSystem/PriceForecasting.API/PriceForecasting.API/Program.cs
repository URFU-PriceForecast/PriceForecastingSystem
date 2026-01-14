global using PriceForecasting.Data.Context;

using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PriceForecasting.Core.Services;



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

// DbContext - SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// Добавляем MemoryCache (для кеширования рекомендаций 6 часов)
builder.Services.AddMemoryCache();

// Авторизация полностью отключена для демо-режима

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

// Добавляем поддержку статических файлов
builder.Services.AddDirectoryBrowser();

var app = builder.Build();

// Инициализация базы данных с тестовыми данными
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        SeedData.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AllowAll");
// Полностью убрана авторизация для демо-режима
// app.UseAuthorization();
app.MapControllers();

// Порт для локальной разработки
var port = "5229";
app.Urls.Add($"http://localhost:{port}");
Console.WriteLine($"Server starting on port {port}");

app.Run();
