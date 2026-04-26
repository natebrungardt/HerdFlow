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

## Core Principles

- Keep controllers thin, logic in services
- Optimize DB queries (EF → SQL awareness)
- Avoid over-fetching
- Index frequently queried fields
- Prefer simple, maintainable solutions

## Performance Focus Areas

- Workday aggregation queries
- Notes loading
- Initial page load latency (Railway + DB)

## Performance Debugging Playbook

When analyzing slow endpoints:

1. Identify number of DB queries executed
2. Check for N+1 query patterns
3. Evaluate EF query → SQL translation
4. Look for over-fetching (use projections when possible)
5. Verify indexes on filtered/sorted fields
6. Reduce DB round trips before other optimizations

## Data Integrity Rules

- Each cow action must map only to its specific cow
- Never apply actions globally across all cows unless explicitly intended
- Ensure correct filtering/grouping in workday-related queries

## Guidelines for Claude

- Be concise and direct
- Do not over-engineer solutions
- Prefer modifying existing code over adding abstractions
- Focus on performance and real-world usability
- Only include explanations when necessary

## Response Expectations

- Return only what is needed to solve the problem
- Prefer code changes over explanations
- Use minimal snippets or diff-style responses
- Do not repeat context

## Default Approach

When solving problems:

1. Understand the specific scope (endpoint, service, or query)
2. Identify the root issue
3. Provide the simplest effective fix
4. Avoid unnecessary changes outside the scope
