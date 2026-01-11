// Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using BC = BCrypt.Net.BCrypt;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("Auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email и пароль обязательны" });
        }

        // Проверяем, существует ли уже пользователь
        var existingUser = await _db.users
            .FirstOrDefaultAsync(u => u.email == request.Email);

        if (existingUser != null)
        {
            return BadRequest(new { message = "Пользователь с таким email уже существует" });
        }

        // Создаем нового пользователя
        var user = new User
        {
            username = request.Email, // Используем email как username
            email = request.Email,
            password = BC.HashPassword(request.Password)
        };

        _db.users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Регистрация успешна", userId = user.id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email и пароль обязательны" });
        }

        // Ищем пользователя по email
        var user = await _db.users
            .FirstOrDefaultAsync(u => u.email == request.Email);

        if (user == null || !BC.Verify(request.Password, user.password))
        {
            return Unauthorized(new { message = "Неверный email или пароль" });
        }

        // Генерируем JWT токен
        var token = GenerateJwtToken(user);

        return Ok(new
        {
            message = "Вход выполнен успешно",
            userId = user.id,
            email = user.email,
            username = user.username,
            token = token
        });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = "SuperSecretKey123!@#"; // В продакшене брать из конфигурации
        var jwtIssuer = "PRICER";
        var jwtAudience = "PRICER-CLIENTS";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.Now.AddDays(7), // Токен действителен 7 дней
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class RegisterRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class LoginRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}
