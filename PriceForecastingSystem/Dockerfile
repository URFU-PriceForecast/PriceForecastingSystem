# PRICER Platform - Production Dockerfile
# Multi-stage build for optimal image size and security

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["PriceForecasting.API/PriceForecasting.API/PriceForecasting.API.csproj", "PriceForecasting.API/"]
COPY ["PriceForecasting.Core/PriceForecasting.Core.csproj", "PriceForecasting.Core/"]
COPY ["PriceForecasting.Data/PriceForecasting.Data.csproj", "PriceForecasting.Data/"]
COPY ["PriceForecasting.ML/PriceForecasting.ML.csproj", "PriceForecasting.ML/"]

RUN dotnet restore "PriceForecasting.API/PriceForecasting.API.csproj"

# Copy source code
COPY ["PriceForecasting.API/", "PriceForecasting.API/"]
COPY ["PriceForecasting.Core/", "PriceForecasting.Core/"]
COPY ["PriceForecasting.Data/", "PriceForecasting.Data/"]
COPY ["PriceForecasting.ML/", "PriceForecasting.ML/"]

# Build application
WORKDIR "/src/PriceForecasting.API"
RUN dotnet build "PriceForecasting.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "PriceForecasting.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime

# Install Python for ML services
RUN apk add --no-cache python3 py3-pip curl

# Create non-root user for security
RUN adduser --disabled-password --home /app --gecos '' appuser && chown -R appuser:appuser /app
USER appuser

# Set working directory
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Copy ML service files
COPY --chown=appuser:appuser ["ml_final/", "./ml_final/"]

# Install Python dependencies for ML
RUN pip3 install --user --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    matplotlib \
    seaborn \
    statsmodels \
    requests

# Create health check endpoint
RUN echo '{"status":"healthy","timestamp":"$(date)"}' > health.json

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5229/api/products || exit 1

# Expose port
EXPOSE 5229

# Set environment variables for production
ENV ASPNETCORE_URLS=http://+:5229
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_CLI_TELEMETRY_OPTOUT=true

# Create logs directory
RUN mkdir -p /app/logs

# Start application
ENTRYPOINT ["dotnet", "PriceForecasting.API.dll"]
