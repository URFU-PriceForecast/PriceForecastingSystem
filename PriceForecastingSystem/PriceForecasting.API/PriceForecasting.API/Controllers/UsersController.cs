// Controllers/UsersController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PriceForecasting.Data.Context;
using PriceForecasting.Data.Models;
using BC = BCrypt.Net.BCrypt;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.users.AnyAsync(u => u.username == dto.Username || u.email == dto.Email))
            return BadRequest("Пользователь с таким именем или email уже существует.");

        var user = new User
        {
            username = dto.Username,
            email = dto.Email,
            password = BC.HashPassword(dto.Password) // хэшируем пароль
        };

        _db.users.Add(user);
        await _db.SaveChangesAsync();
        return Ok("Регистрация успешна");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.users.FirstOrDefaultAsync(u => u.username == dto.UsernameOrEmail || u.email == dto.UsernameOrEmail);
        if (user == null || !BC.Verify(dto.Password, user.password))
            return Unauthorized("Неверное имя пользователя или пароль.");

        // В реальном проекте здесь будет выдача JWT — пока просто OK
        return Ok(new { message = "Успешный вход", userId = user.id });
    }
}

public class RegisterDto
{
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class LoginDto
{
    public string UsernameOrEmail { get; set; } = default!;
    public string Password { get; set; } = default!;
}