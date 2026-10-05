# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY Backend-jobby.csproj ./
RUN dotnet restore Backend-jobby.csproj

# Copy remaining source code and publish
COPY . ./
RUN dotnet publish Backend-jobby.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Default ASP.NET Core port
ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 8080

ENTRYPOINT ["dotnet", "Backend-jobby.dll"]
