# Test PriceForecasting API
Write-Host "Testing PriceForecasting API..." -ForegroundColor Green
Write-Host ""

# Check if server is running
Write-Host "Checking if server is running on port 5229..." -ForegroundColor Yellow
$portInUse = netstat -ano | findstr ":5229"
if ($portInUse) {
    Write-Host "[OK] Server is listening on port 5229" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Server is not running on port 5229" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Testing API endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test WeatherForecast
Write-Host "1. Testing WeatherForecast API:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5229/WeatherForecast" -Method GET -Headers @{ "Accept" = "application/json" } -UseBasicParsing
    if ($response.StatusCode -eq 200 -and $response.Content -like "*temperatureC*") {
        Write-Host "[OK] WeatherForecast API working" -ForegroundColor Green
        Write-Host "Response preview:" $response.Content.Substring(0, 100) "..." -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] WeatherForecast API response not as expected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] WeatherForecast API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Products API
Write-Host "2. Testing Products API:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5229/api/Products" -Method GET -Headers @{ "Accept" = "application/json" } -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Products API working" -ForegroundColor Green
        Write-Host "Response contains products data" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] Products API returned status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Products API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Swagger
Write-Host "3. Testing Swagger UI:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5229/swagger/index.html" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Swagger UI accessible at http://localhost:5229/swagger/index.html" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Swagger UI returned status $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Swagger UI not accessible: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Green
Read-Host "Press Enter to exit"
