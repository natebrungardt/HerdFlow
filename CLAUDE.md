# HerdFlow Context

## Overview

HerdFlow is a cattle management SaaS focused on simplicity and real-world usability for small to mid-size ranch operations.

## Stack

- Frontend: React (Vite, TypeScript)
- Backend: .NET (ASP.NET Core)
- Database: PostgreSQL (Supabase)
- Auth: Supabase JWT

## Architecture

- Controllers → Services → EF Core
- REST API
- Per-user data scoping via user_id
- Soft delete pattern (archive/restore)

## Key Domains

- Cows (core entity, unique tag per user)
- Workday (tracks daily actions across cows)
- Notes (linked to cows or workdays)

## Important Patterns

- Keep controllers thin, logic in services
- Optimize DB queries (EF → SQL awareness)
- Avoid over-fetching
- Index frequently queried fields

## Performance Focus Areas

- Workday aggregation queries
- Notes loading
- Initial page load latency (Railway + DB)

## Product Philosophy

- Simple > complex
- Fast > feature-heavy
- Built for real ranch workflows (non-technical users)

## Guidelines for Claude

- Be concise and direct
- Do not over-engineer solutions
- Prefer modifying existing code over adding new abstractions
- Focus on performance and real-world usability
- Only include explanations when necessary
