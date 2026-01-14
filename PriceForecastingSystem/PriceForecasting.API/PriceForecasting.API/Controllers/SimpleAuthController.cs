using Microsoft.AspNetCore.Mvc;

namespace PriceForecasting.API.Controllers;

[ApiController]
[Route("Auth")]
public class SimpleAuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] object request)
    {
        return Ok(new
        {
            message = "Демо-режим: авторизация успешна",
            userId = 1,
            email = "demo@example.com",
            username = "DemoUser",
            token = "demo-token-no-auth-required"
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] object request)
    {
        return Ok(new { message = "Демо-режим: регистрация успешна" });
    }
}
