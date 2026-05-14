# GunSelf Monorepo

GunSelf is a Personal Life Operating System monorepo for Web and Mobile apps with shared logic/packages and Supabase backend.

## Stack

- Web: Next.js (App Router), React, TypeScript, TailwindCSS
- Mobile: Expo, React Native, TypeScript, Expo Router
- Backend: Supabase Auth, PostgreSQL, Storage
- Monorepo: pnpm workspace + Turborepo

## Workspace Structure

- `apps/web`: Next.js web app
- `apps/mobile`: Expo mobile app
- `packages/types`: shared database/domain types
- `packages/utils`: shared utility functions
- `packages/validation`: shared zod schemas
- `packages/services`: shared service wrappers for Supabase
- `supabase/schema.sql`: base DB schema + RLS policies
- `docs/*`: project documentation placeholders

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- If `pnpm` is not in PATH, use `corepack pnpm ...` equivalents.

## Setup

1. Install dependencies:

```bash
corepack pnpm install
```

2. Create root env file from template:

```bash
cp .env.example .env
```

3. Web env:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

4. Mobile env:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

5. Fill Supabase variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Run

### Web (priority)

```bash
corepack pnpm dev:web
```

Open [http://localhost:3001](http://localhost:3001)

### Mobile

```bash
corepack pnpm dev:mobile
```

Then run Android/iOS/Web from Expo CLI.

## Build / Quality

```bash
corepack pnpm build:web
corepack pnpm lint
corepack pnpm typecheck
```

## Supabase Schema

- Schema file: `supabase/schema.sql`
- Seed placeholder: `supabase/seed.sql`

Apply schema in Supabase SQL editor (or Supabase CLI migration flow) before implementing real CRUD/auth flows.

## Current Scope (Initialized)

- Monorepo and package boundaries
- Web app route placeholders (auth + dashboard modules)
- Mobile app route placeholders (auth + tabs)
- Shared types/utils/validation/services packages
- Supabase connection base on both Web and Mobile
- Initial DB schema + RLS policies
- Docs skeleton

## Not Included Yet

- Full CRUD features
- AI coaching logic
- Charts/analytics UI
- Payment/notifications
- Store deployment setup
- Production-ready final UI
