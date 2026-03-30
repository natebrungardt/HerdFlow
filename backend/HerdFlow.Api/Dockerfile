# Use .NET SDK to build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy csproj first and restore
COPY HerdFlow.Api.csproj ./
RUN dotnet restore HerdFlow.Api.csproj

# Copy everything else
COPY . ./

# Publish the API
WORKDIR /app
RUN dotnet publish HerdFlow.Api.csproj -c Release -o /app/out

# Use ASP.NET runtime for final image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/out .

EXPOSE 8080
ENTRYPOINT ["dotnet", "HerdFlow.Api.dll"]
