FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy csproj first and restore
COPY HerdFlow.Api/HerdFlow.Api.csproj ./HerdFlow.Api/
RUN dotnet restore ./HerdFlow.Api/HerdFlow.Api.csproj

# Copy everything else
COPY . ./

# Move into project directory and publish
WORKDIR /app/HerdFlow.Api
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 8080
ENTRYPOINT ["dotnet", "HerdFlow.Api.dll"]
