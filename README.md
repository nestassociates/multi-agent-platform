# Nest Associates Multi-Agent Real Estate Platform

A JAMstack platform enabling a central admin team to manage 1,000+ independent real estate agents, each with their own branded microsite.

## Features

- **Admin Dashboard**: Manage agents, moderate content, assign territories, monitor builds
- **Agent Dashboard**: Create content, manage profile, view analytics
- **Agent Microsites**: 1,000+ static sites deployed to subdomains (Astro 4.x)
- **Property Sync**: Real-time synchronization from Apex27 CRM
- **Territory Management**: Postcode-based territory assignment system
- **Content Moderation**: Approval workflow with email notifications
- **Build System**: Automated static site generation with priority queue
- **Agent Lifecycle**: Auto-detection from Apex27, profile completion tracking, admin approval workflow

## Technology Stack

- **Monorepo**: Turborepo
- **Dashboard**: Next.js 14 App Router, React 18, TypeScript
- **Agent Sites**: Astro 4.x (static generation)
- **Database**: Supabase (PostgreSQL 15 with PostGIS)
- **Auth**: Supabase Auth (JWT + 2FA)
- **UI**: Tailwind CSS, shadcn/ui, Tiptap
- **Maps**: Mapbox GL JS
- **Email**: Resend + React Email
- **Hosting**: Vercel

## Project Structure

```
├── apps/
│   ├── dashboard/       # Next.js 14 - Admin & Agent dashboards
│   └── agent-site/      # Astro 4.x - Static microsite template
├── packages/
│   ├── shared-types/    # TypeScript types
│   ├── ui/              # shadcn/ui components
│   ├── database/        # Migrations, RLS policies
│   ├── validation/      # Zod schemas
│   ├── build-system/    # Build orchestration
│   └── email/           # Email templates
├── supabase/            # Database migrations
├── tests/               # E2E and integration tests
└── specs/               # Feature specifications and plans
```

## Quick Start

See the comprehensive developer guide:

**[→ Developer Quickstart Guide](./specs/001-multi-agent-platform/quickstart.md)**

### Prerequisites

- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- Supabase CLI: `npm install -g supabase`

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/agent-site/.env.example apps/agent-site/.env.local
# Edit .env.local files with your API keys

# Initialize Supabase (local or cloud)
cd supabase
supabase start  # For local development
# OR
supabase link --project-ref your-project-ref  # For cloud

# Run migrations
supabase db push

# Start development servers
npm run dev:dashboard    # Dashboard at http://localhost:3000
npm run dev:agent-site   # Agent site preview at http://localhost:4321
```

## Development

### Run Dashboard

```bash
npm run dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000)

### Run Tests

```bash
npm run test           # All tests
npm run test:e2e       # E2E tests
npm run test:watch     # Watch mode
```

### Build for Production

```bash
npm run build
```

## Documentation

### Platform Foundation
- **[Feature Specification](./specs/001-multi-agent-platform/spec.md)**: Requirements and user stories
- **[Implementation Plan](./specs/001-multi-agent-platform/plan.md)**: Technical architecture
- **[Data Model](./specs/001-multi-agent-platform/data-model.md)**: Database schema
- **[API Contracts](./specs/001-multi-agent-platform/contracts/openapi.yaml)**: OpenAPI specification
- **[Quickstart Guide](./specs/001-multi-agent-platform/quickstart.md)**: Detailed setup instructions

### Agent Lifecycle Management
- **[Admin Guide](./specs/004-agent-lifecycle-management/admin-guide.md)**: Managing agent onboarding and status
- **[Agent Guide](./specs/004-agent-lifecycle-management/agent-guide.md)**: Profile completion and site activation
- **[Lifecycle Spec](./specs/004-agent-lifecycle-management/spec.md)**: Technical specification

## Contributing

1. Create feature branch from `main`
2. Make changes following the task list in `specs/001-multi-agent-platform/tasks.md`
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Commit with conventional commits: `feat:`, `fix:`, `docs:`
6. Push and create PR

## License

Proprietary - Nest Associates

## Support

- **Documentation**: See `specs/001-multi-agent-platform/` directory
- **Issues**: Create issue on GitHub
- **Contact**: dev@nestassociates.com
