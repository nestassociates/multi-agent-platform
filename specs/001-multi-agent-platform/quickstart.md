# Developer Quickstart Guide

**Feature**: Multi-Agent Real Estate Platform
**Date**: 2025-10-29
**Estimated Setup Time**: 30-45 minutes

## Overview

This guide will help you set up your local development environment for the Multi-Agent Real Estate Platform. By the end, you'll have the dashboard running locally, connected to a Supabase database, and ready for feature development.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: v18.17.0 or higher (check: `node --version`)
- **npm**: v9.0.0 or higher (check: `npm --version`)
- **Git**: Latest version (check: `git --version`)
- **Supabase CLI**: For local database development (install: `npm install -g supabase`)
- **Code Editor**: VS Code recommended (with TypeScript, ESLint, Prettier extensions)

---

## Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/nest-associates/multi-agent-platform.git
cd multi-agent-platform

# Checkout the feature branch
git checkout 001-multi-agent-platform
```

---

## Step 2: Install Dependencies

```bash
# Install all dependencies for monorepo
npm install

# This installs dependencies for:
# - Root workspace
# - apps/dashboard
# - apps/agent-site
# - All packages/*
```

---

## Step 3: Set Up Environment Variables

### Create `.env.local` files

**For Dashboard (`apps/dashboard/.env.local`)**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Apex27 Webhook
APEX27_WEBHOOK_SECRET=your-webhook-secret

# OS Data Hub API
OS_DATA_HUB_API_KEY=your-api-key

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Vercel (for build system)
VERCEL_API_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id

# Email (Resend)
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=noreply@nestassociates.com

# Sentry (optional for local dev)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token

# Environment
NODE_ENV=development
```

**For Agent Site (`apps/agent-site/.env.local`)**:

```bash
# Public API URL (points to dashboard API)
PUBLIC_API_URL=http://localhost:3000/api

# Google Analytics (optional for local dev)
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Tag Manager (optional for local dev)
PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Get API Keys

1. **Supabase**:
   - Create a project at [https://supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy `URL`, `anon public` key, and `service_role` key

2. **Mapbox**:
   - Sign up at [https://www.mapbox.com](https://www.mapbox.com)
   - Create an access token at [https://account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens)

3. **OS Data Hub** (UK Property Data):
   - Register at [https://osdatahub.os.uk](https://osdatahub.os.uk)
   - Create a project and API key for Features API

4. **Resend** (Email):
   - Sign up at [https://resend.com](https://resend.com)
   - Create API key in dashboard

5. **Vercel** (for build system):
   - Get token at [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Find team ID in team settings

---

## Step 4: Set Up Supabase Database

### Option A: Use Supabase Cloud (Recommended for quick start)

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Run migrations:

```bash
# Navigate to supabase directory
cd supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed initial data
supabase db seed
```

### Option B: Use Local Supabase (For offline development)

```bash
# Start local Supabase (requires Docker)
supabase start

# This will:
# - Start PostgreSQL database
# - Start Supabase Studio at http://localhost:54323
# - Start API server at http://localhost:54321
# - Print connection details

# Run migrations
supabase db push

# Seed initial data
supabase db seed
```

### Verify Database Setup

```bash
# Check migrations applied
supabase db status

# Open Supabase Studio to view tables
# Cloud: https://app.supabase.com/project/your-project/editor
# Local: http://localhost:54323
```

You should see these tables:
- profiles
- agents
- properties
- territories
- content_submissions
- build_queue
- global_content
- audit_logs
- contact_form_submissions

---

## Step 5: Create Admin User

```sql
-- Run this in Supabase SQL Editor

-- 1. Create auth user (via Supabase Auth UI or API)
-- Email: admin@nestassociates.com
-- Password: (set a secure password)
-- Then get the user_id from auth.users table

-- 2. Create profile
INSERT INTO profiles (user_id, role, email, first_name, last_name)
VALUES (
  'auth-user-id-from-step-1',
  'super_admin',
  'admin@nestassociates.com',
  'Admin',
  'User'
);
```

**Alternative: Use Supabase Auth UI**:
1. Go to Authentication → Users in Supabase Studio
2. Click "Invite User" or "Add User"
3. Enter email: `admin@nestassociates.com`
4. Create user
5. Copy the user ID
6. Run the INSERT statement above with the user ID

---

## Step 6: Run Development Servers

### Start Dashboard

```bash
# From repo root
npm run dev:dashboard

# Or directly in dashboard directory
cd apps/dashboard
npm run dev
```

Dashboard will be available at: **http://localhost:3000**

### Start Agent Site Template (Optional)

```bash
# From repo root (in separate terminal)
npm run dev:agent-site

# Or directly in agent-site directory
cd apps/agent-site
npm run dev
```

Agent site preview will be available at: **http://localhost:4321**

---

## Step 7: Log In and Verify

1. Open browser to **http://localhost:3000**
2. Click "Login"
3. Enter admin credentials:
   - Email: `admin@nestassociates.com`
   - Password: (the password you set)
4. You should see the admin dashboard

### Verify Features

- **Agents**: Navigate to `/agents` - should show empty list with "Create Agent" button
- **Territories**: Navigate to `/territories` - should show map (requires Mapbox token)
- **Content Moderation**: Navigate to `/content-moderation` - should show empty queue
- **Build Queue**: Navigate to `/build-queue` - should show empty queue

---

## Step 8: Create Test Agent (Optional)

1. In the dashboard, navigate to **Agents → Create Agent**
2. Fill in the form:
   - Email: `john.smith@example.com`
   - Password: `TestPassword123!`
   - First Name: `John`
   - Last Name: `Smith`
   - Subdomain: `john-smith`
   - Apex27 Branch ID: `BR001` (or leave blank)
3. Click "Create Agent"
4. Check welcome email (if Resend is configured)
5. Log out and log in as the agent to test agent dashboard

---

## Step 9: Test Webhook (Optional)

### Use cURL to simulate Apex27 webhook

```bash
# Generate HMAC-SHA256 signature
PAYLOAD='{"event":"property.created","timestamp":"2025-10-29T10:00:00Z","branch_id":"BR001","property":{"id":"PROP-001","transaction_type":"sale","title":"Test Property","price":450000,"address":{"line1":"123 Test St","city":"London","postcode":"SW1A 1AA"},"postcode":"SW1A 1AA","latitude":51.5074,"longitude":-0.1278}}'

SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "your-webhook-secret" | sed 's/.* //')

# Send webhook
curl -X POST http://localhost:3000/api/webhooks/apex27 \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"

# Check response (should be 200 OK)
```

### Verify property was created

1. Log in as agent (email: `john.smith@example.com`)
2. Navigate to Properties tab
3. Should see "Test Property" listed

---

## Troubleshooting

### Database Connection Issues

```bash
# Check Supabase is running
supabase status

# Reset database (WARNING: deletes all data)
supabase db reset

# Check connection string
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Or build specific package
cd packages/shared-types
npm run build
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev:dashboard
```

### Supabase Migrations Failing

```bash
# Check migration status
supabase migration list

# Manually apply specific migration
supabase migration up --target 20241029000001

# Rollback last migration
supabase migration down
```

---

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes to code

3. Run tests:
   ```bash
   npm run test
   ```

4. Run linter:
   ```bash
   npm run lint
   ```

5. Commit changes:
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

6. Push branch:
   ```bash
   git push origin feature/my-feature
   ```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test apps/dashboard/tests/agent-creation.test.ts
```

### Database Migrations

```bash
# Create new migration
supabase migration new add_new_column

# Edit migration file in supabase/migrations/

# Apply migration
supabase migration up

# Rollback migration
supabase migration down
```

---

## Common Tasks

### Add New Shared Type

```bash
# Edit packages/shared-types/entities.ts or api.ts

# Rebuild package
cd packages/shared-types
npm run build

# Types are now available in other packages
```

### Add New API Endpoint

```bash
# Create route file
# apps/dashboard/app/api/my-endpoint/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Your logic here

  return NextResponse.json({ data: [] });
}
```

### Add New Database Table

```bash
# Create migration
supabase migration new create_new_table

# Edit migration file
# supabase/migrations/XXXXXX_create_new_table.sql

CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

# Create RLS policy
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);

# Apply migration
supabase migration up
```

### Add New shadcn/ui Component

```bash
# Install component
npx shadcn-ui@latest add button

# Component added to packages/ui/components/ui/button.tsx
# Can now import from @nest/ui
```

---

## VS Code Setup

### Recommended Extensions

Install these VS Code extensions:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TypeScript Vue Plugin (Volar)** (`Vue.volar`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **PostCSS Language Support** (`csstools.postcss`)
- **Prisma** (if using Prisma) (`Prisma.prisma`)
- **PostgreSQL** (`ckolkman.vscode-postgres`)

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev:dashboard",
      "cwd": "${workspaceFolder}",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

---

## Useful Commands

### Turbo commands

```bash
# Build all packages
npm run build

# Lint all packages
npm run lint

# Test all packages
npm run test

# Format all code
npm run format

# Type check all packages
npm run typecheck

# Clean all build artifacts
npm run clean
```

### Supabase commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View logs
supabase logs

# Open Supabase Studio
supabase studio

# Generate TypeScript types from database schema
supabase gen types typescript --local > packages/shared-types/supabase.ts
```

### Git commands

```bash
# Create feature branch from main
git checkout main
git pull
git checkout -b feature/my-feature

# Stash changes
git stash
git stash pop

# View diff
git diff

# Amend last commit
git commit --amend --no-edit
```

---

## Next Steps

Now that your environment is set up, you can:

1. **Read the Architecture Docs**: See `specs/001-multi-agent-platform/plan.md`
2. **Review Data Model**: See `specs/001-multi-agent-platform/data-model.md`
3. **Explore API Contracts**: See `specs/001-multi-agent-platform/contracts/openapi.yaml`
4. **Start Implementing**: Run `/speckit.tasks` to see implementation tasks

---

## Getting Help

- **Slack**: #multi-agent-platform channel
- **Documentation**: See `specs/001-multi-agent-platform/` directory
- **Issues**: Create issue on GitHub with label `question`
- **Code Review**: Tag `@engineering` team for review

---

## Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Astro Docs](https://docs.astro.build/)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [PostGIS Docs](https://postgis.net/docs/)

---

**Happy coding!** If you encounter any issues not covered in this guide, please update this document or reach out to the team.
