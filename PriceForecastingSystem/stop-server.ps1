# Скрипт для остановки сервера PriceForecastingSystem

Write-Host "🔍 Поиск запущенных процессов сервера..." -ForegroundColor Yellow

# Ищем процессы сервера
$serverProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*PriceForecasting*" -or
    $_.MainModule.FileName -like "*PriceForecasting.API*"
} 2>$null

if ($serverProcesses) {
    Write-Host "⚠️ Найдено $($serverProcesses.Count) процессов сервера:" -ForegroundColor Red
    foreach ($process in $serverProcesses) {
        Write-Host "  - $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force
        Write-Host "  ✅ Завершен процесс $($process.Id)" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️ Процессы сервера не найдены" -ForegroundColor Blue
}

# Проверяем порт 5229
$portInUse = netstat -ano | findstr ":5229" 2>$null
if ($portInUse) {
    $processId = ($portInUse -split '\s+')[-1]
    if ($processId -and $processId -ne "0") {
        Write-Host "⚠️ Порт 5229 все еще занят процессом $processId. Завершаю..." -ForegroundColor Red
        Stop-Process -Id $processId -Force 2>$null
        Write-Host "✅ Процесс $processId завершен" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Порт 5229 свободен" -ForegroundColor Green
}

Write-Host "🎯 Все процессы сервера остановлены!" -ForegroundColor Green
