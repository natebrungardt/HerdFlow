# HerdFlowV2

HerdFlowV2 is a local MVP application for tracking cows.

It includes:

- React + TypeScript web app
- ASP.NET Core backend API
- PostgreSQL database (via Docker)

## Repo Layout

- `apps/web`
- `apps/ios`
- `services/api`

Payments can live in `services/api` first if Stripe is added later. Split that into a separate service only if billing grows into its own deployment or operational concern.

## Run Locally

### 1. Start the Database

From the project root:

```bash
docker compose up -d
```

### 2. Run the Backend

```bash
cd services/api
dotnet restore
dotnet ef database update
dotnet watch run
```

Backend URL:

```text
http://localhost:5062
```

Swagger UI:

```text
http://localhost:5062/swagger
```

### 3. Run the Web App

```bash
cd apps/web
npm install
npm run dev
```

Web app URL:

```text
http://localhost:5173
```

## Web App Environment Variables

Create a file at:

```text
apps/web/.env
```

Add:

```env
VITE_API_URL=http://localhost:5062/api/cows
```

## Current Features

- View all cows
- Create a cow
- Prevent duplicate tag numbers
- Backend validation for required fields
- Clean error handling (409 for duplicate tags)

## Tech Stack

- React + TypeScript
- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- Docker
