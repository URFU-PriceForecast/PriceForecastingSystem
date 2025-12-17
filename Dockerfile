# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем csproj файлы
COPY ["PriceForecasting.API/PriceForecasting.API.csproj", "PriceForecasting.API/"]
COPY ["PriceForecasting.Data/PriceForecasting.Data.csproj", "PriceForecasting.Data/"]
COPY ["PriceForecasting.Core/PriceForecasting.Core.csproj", "PriceForecasting.Core/"]

RUN dotnet restore "PriceForecasting.API/PriceForecasting.API.csproj"

# Копируем весь код
COPY . .

WORKDIR "/src/PriceForecasting.API"
RUN dotnet build "PriceForecasting.API.csproj" -c Release -o /app/build

RUN dotnet publish "PriceForecasting.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT:-5000}

ENTRYPOINT ["dotnet", "PriceForecasting.API.dll"]
