# MCP Server Usage Examples for Multi-Agent Platform

**Date**: 2025-10-29
**Purpose**: Practical examples of using MCP servers for common project tasks

---

## Daily Development Workflows

### Starting a New Feature

```
You: "Create a new branch called feature/agent-dashboard"
→ Git MCP creates branch and checks it out

You: "Create the base component file for agent dashboard at apps/dashboard/components/agent/dashboard.tsx"
→ Filesystem MCP creates file with boilerplate

You: "Read the agent entity type from packages/shared-types/src/entities.ts"
→ Filesystem MCP shows Agent interface

You: "Generate a React component for displaying agent stats using the Agent type"
→ Claude generates component with proper types
```

---

## Database Operations

### Exploring Database Schema

```
You: "Show me all tables in my Supabase database"
→ Supabase MCP lists: profiles, agents, properties, territories, content_submissions, build_queue, etc.

You: "Describe the agents table schema"
→ Supabase MCP shows: columns, types, constraints, indexes

You: "Show me the RLS policies on the agents table"
→ Supabase MCP shows all Row Level Security policies
```

### Running Queries

```
You: "How many agents do we have in the database?"
→ PostgreSQL MCP runs: SELECT COUNT(*) FROM agents

You: "Show me the 5 most recently created properties"
→ PostgreSQL MCP runs: SELECT * FROM properties ORDER BY created_at DESC LIMIT 5

You: "Find all properties within 10km of central London (51.5074, -0.1278)"
→ PostgreSQL MCP runs PostGIS query with ST_DWithin
```

### Creating Migrations

```
You: "Create a migration to add apex27_sync_log table"
→ Supabase MCP generates migration file with timestamp

You: "Generate TypeScript types from the current database schema"
→ Supabase MCP creates types matching your tables
```

---

## GitHub Workflows

### Managing Branches and PRs

```
You: "Show me all branches in the repository"
→ GitHub MCP lists all remote and local branches

You: "Create a PR from 001-multi-agent-platform to main with title 'Complete Foundation Setup'"
→ GitHub MCP creates PR with description

You: "List all open PRs"
→ GitHub MCP shows PR list with status

You: "Add a comment to PR #1 saying 'LGTM, ready to merge'"
→ GitHub MCP posts comment
```

### Managing Issues

```
You: "Create an issue titled 'Implement User Story 1: Agent Creation' with label 'enhancement'"
→ GitHub MCP creates issue

You: "List all issues with label 'bug'"
→ GitHub MCP filters and lists

You: "Close issue #5 with comment 'Fixed in PR #6'"
→ GitHub MCP closes issue with comment
```

### Monitoring CI/CD

```
You: "Show me the status of GitHub Actions workflows"
→ GitHub MCP shows workflow runs

You: "Show me the logs from the failed CI run"
→ GitHub MCP retrieves workflow logs

You: "Re-run the failed workflow"
→ GitHub MCP triggers re-run
```

---

## Geospatial Operations with Mapbox

### Geocoding Addresses

```
You: "Geocode the address: 123 High Street, London SW1A 1AA"
→ Mapbox MCP returns: {latitude: 51.5074, longitude: -0.1278}

You: "Reverse geocode coordinates 51.5074, -0.1278"
→ Mapbox MCP returns address string
```

### Territory Analysis

```
You: "Find all cafes within 2km of coordinates 53.8008, -1.5491"
→ Mapbox MCP POI search returns nearby cafes

You: "Calculate a 30-minute driving isochrone from 51.5074, -0.1278"
→ Mapbox MCP returns GeoJSON polygon for territory visualization

You: "Generate a static map image showing this polygon"
→ Mapbox MCP returns map image URL
```

### Routing and Distances

```
You: "Find the driving route from Leeds to York"
→ Mapbox MCP returns route with distance and duration

You: "Calculate travel time matrix between these 5 agent office locations"
→ Mapbox MCP returns distance/duration matrix for all pairs
```

---

## Deployment Workflows

### Vercel Operations

```
You: "Show me all Vercel projects"
→ Vercel MCP lists projects in your account

You: "Show deployments for multi-agent-platform dashboard"
→ Vercel MCP lists recent deployments with status

You: "Show me the logs from the latest deployment"
→ Vercel MCP retrieves deployment logs

You: "Search Vercel docs for cron job configuration"
→ Vercel MCP searches documentation
```

---

## Testing Workflows

### Playwright Browser Testing

```
You: "Launch Playwright and navigate to localhost:3000/login"
→ Playwright MCP opens browser and navigates

You: "Fill in email field with 'admin@test.com' and password with 'test123'"
→ Playwright MCP fills form fields

You: "Click the login button and wait for redirect"
→ Playwright MCP clicks and waits

You: "Take a screenshot of the current page"
→ Playwright MCP captures screenshot

You: "Run accessibility tests on this page"
→ Playwright MCP runs axe-core audit
```

---

## Email Operations

### Sending Emails (Resend MCP)

```
You: "Send a test email to developer@nestassociates.com with subject 'MCP Test' and body 'Testing Resend integration'"
→ Resend MCP sends email

You: "Schedule an email to be sent tomorrow at 9am"
→ Resend MCP schedules email

You: "Send email with HTML template from packages/email/templates/welcome.tsx"
→ Resend MCP sends rendered React Email template
```

---

## Documentation Access

### Framework Documentation

```
You: "How do I handle dynamic routes in Astro?"
→ Astro Docs MCP retrieves latest documentation

You: "What's the recommended way to use Server Actions in Next.js 14?"
→ Next.js DevTools MCP searches Next.js docs

You: "Show me examples of PostGIS ST_Within queries"
→ Fetch MCP retrieves PostGIS documentation
```

---

## Complex Multi-Server Workflows

### Complete Feature Implementation

```
Workflow: Implement agent creation form

You: "Create a new branch called feature/agent-creation-form"
→ Git MCP creates and checks out branch

You: "Read the createAgentSchema from packages/validation/src/agent.ts"
→ Filesystem MCP reads schema

You: "Create a React form component at apps/dashboard/components/admin/create-agent-form.tsx using this schema with React Hook Form and shadcn/ui"
→ Claude generates component

You: "Create the API route at apps/dashboard/app/api/admin/agents/route.ts"
→ Filesystem MCP creates API route file

You: "Add to git staging"
→ Git MCP stages files

You: "Commit with message 'feat: add agent creation form and API route'"
→ Git MCP commits

You: "Push to origin"
→ Git MCP pushes branch

You: "Create a PR to main"
→ GitHub MCP creates pull request
```

### Database Migration Workflow

```
You: "Show me the current agents table schema"
→ Supabase MCP describes table

You: "Create a migration to add email_verified boolean column to agents table, default false"
→ Supabase MCP generates migration file

You: "Apply this migration to my development database"
→ Supabase MCP runs migration

You: "Verify the column was added"
→ PostgreSQL MCP runs: \d agents

You: "Generate updated TypeScript types"
→ Supabase MCP generates types from new schema
```

### Deployment and Monitoring

```
You: "Show me the git diff for uncommitted changes"
→ Git MCP shows diff

You: "Commit all changes with message 'feat: enhance agent dashboard'"
→ Git MCP commits

You: "Push to origin"
→ Git MCP pushes

You: "Check latest Vercel deployment status"
→ Vercel MCP shows deployment progress

You: "If deployment failed, show me the logs"
→ Vercel MCP retrieves error logs

You: "Search Vercel docs for error message"
→ Vercel MCP searches documentation
```

---

## PostGIS Spatial Operations

### Territory Management

```
You: "Check if PostGIS extension is enabled in my database"
→ PostgreSQL MCP runs: SELECT * FROM pg_extension WHERE extname = 'postgis'

You: "Find all territories that overlap with this polygon: [GeoJSON]"
→ PostgreSQL MCP runs: SELECT * FROM territories WHERE ST_Intersects(boundary, ST_GeogFromGeoJSON(...))

You: "Calculate the area in square kilometers of territory with ID 'xyz'"
→ PostgreSQL MCP runs: SELECT ST_Area(boundary::geometry) / 1000000 FROM territories WHERE id = 'xyz'

You: "Find all properties within territory ID 'xyz'"
→ PostgreSQL MCP runs: SELECT p.* FROM properties p JOIN territories t ON ST_Within(p.location, t.boundary) WHERE t.id = 'xyz'
```

---

## Property Sync Operations

### Apex27 Integration Testing

```
You: "Show me the Apex27 sync log from the last 24 hours"
→ PostgreSQL MCP runs: SELECT * FROM apex27_sync_log WHERE created_at > NOW() - INTERVAL '24 hours'

You: "Find properties that were updated in the last hour"
→ PostgreSQL MCP runs: SELECT * FROM properties WHERE updated_at > NOW() - INTERVAL '1 hour'

You: "Show me agents with no properties"
→ PostgreSQL MCP runs: SELECT a.* FROM agents a LEFT JOIN properties p ON a.id = p.agent_id WHERE p.id IS NULL
```

---

## Build Queue Management

```
You: "Show me the current build queue status"
→ PostgreSQL MCP runs: SELECT * FROM build_queue WHERE status = 'pending' ORDER BY priority, created_at

You: "How many builds are pending vs processing vs completed?"
→ PostgreSQL MCP runs: SELECT status, COUNT(*) FROM build_queue GROUP BY status

You: "Show me failed builds from the last week"
→ PostgreSQL MCP runs: SELECT * FROM build_queue WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days'
```

---

## Code Quality and Testing

### Linting and Formatting

```
You: "Run ESLint on apps/dashboard/app/api"
→ Next.js DevTools MCP or file operations run lint

You: "Format all TypeScript files in packages/validation"
→ File operations run prettier

You: "Check for TypeScript errors in the dashboard app"
→ Next.js DevTools MCP runs type check
```

### End-to-End Testing

```
You: "Test the login flow: navigate to localhost:3000/login, enter credentials, verify redirect to dashboard"
→ Playwright MCP executes test sequence

You: "Run accessibility tests on all admin pages"
→ Playwright MCP runs axe-core on each page

You: "Take screenshots of the dashboard in mobile viewport"
→ Playwright MCP captures responsive screenshots
```

---

## Research and Documentation

### Finding Solutions

```
You: "How do I implement real-time subscriptions in Supabase?"
→ Fetch MCP retrieves Supabase docs

You: "Show me examples of Astro content collections"
→ Astro Docs MCP searches Astro documentation

You: "Find best practices for Next.js App Router API routes"
→ Next.js DevTools MCP searches Next.js docs
```

---

## Combining Multiple MCP Servers

### Example: Add New Property Feature

```
1. You: "Create branch feature/property-status-badge"
   → Git MCP

2. You: "Read the Property type from packages/shared-types"
   → Filesystem MCP

3. You: "Create StatusBadge component that shows property status with color coding"
   → Claude generates, Filesystem MCP writes

4. You: "Update PropertyCard to use StatusBadge"
   → Filesystem MCP modifies file

5. You: "Show me git diff"
   → Git MCP shows changes

6. You: "Commit with message 'feat: add property status badge'"
   → Git MCP commits

7. You: "Push and create PR"
   → Git MCP pushes, GitHub MCP creates PR

8. You: "Deploy to Vercel preview"
   → Vercel MCP triggers deployment

9. You: "Show deployment logs"
   → Vercel MCP retrieves logs

10. You: "Test the PropertyCard component on preview URL"
    → Playwright MCP runs browser test
```

---

## Time-Saving Commands

### Quick Status Checks

```
"What's my current git status and any uncommitted changes?"
→ Git MCP: shows status + diff

"How many properties do we have in the database by transaction type?"
→ PostgreSQL MCP: SELECT transaction_type, COUNT(*) FROM properties GROUP BY transaction_type

"Are there any failed builds in the queue?"
→ PostgreSQL MCP: SELECT * FROM build_queue WHERE status = 'failed'

"Show me the latest deployment on Vercel"
→ Vercel MCP: lists recent deployments with status
```

### Bulk Operations

```
"Create issues for all remaining user stories (US4-US10)"
→ GitHub MCP: creates 7 issues with proper labels

"Generate migrations for all missing indexes"
→ Supabase MCP: creates migration files

"Run Playwright tests for all auth flows"
→ Playwright MCP: executes test suite
```

---

## Integration-Specific Examples

### Apex27 Dual API Integration

```
"Read the Apex27 Portal API client implementation"
→ Filesystem MCP: reads lib/apex27/portal-client.ts

"Test the Portal API connection with my credentials"
→ Fetch MCP or custom script execution

"Show me properties synced in the last sync"
→ PostgreSQL MCP: queries apex27_sync_log and properties

"Map branch IDs to agent IDs"
→ PostgreSQL MCP: SELECT a.id, a.apex27_branch_id FROM agents a WHERE apex27_branch_id IS NOT NULL
```

### Territory Management

```
"Show me all territories assigned to agent with ID 'xyz'"
→ PostgreSQL MCP: SELECT * FROM territories WHERE agent_id = 'xyz'

"Calculate property count for territory ID 'abc' using PostGIS"
→ PostgreSQL MCP: complex PostGIS query

"Geocode the center point of this territory"
→ Mapbox MCP: reverse geocode centroid

"Generate isochrone for 15-minute drive from territory center"
→ Mapbox MCP: IsochroneTool with driving profile
```

---

## Maintenance Operations

### Database Maintenance

```
"Show me database size and table sizes"
→ PostgreSQL MCP: runs pg_database_size queries

"Find slow queries from the last 24 hours"
→ PostgreSQL MCP: queries pg_stat_statements

"Suggest indexes for optimizing property searches"
→ PostgreSQL MCP: analyzes query patterns and suggests indexes

"Vacuum analyze all tables"
→ PostgreSQL MCP: runs VACUUM ANALYZE
```

### Code Cleanup

```
"Find all TODO comments in the codebase"
→ Filesystem MCP + GitHub MCP: searches codebase

"List all files over 500 lines in apps/dashboard"
→ Filesystem MCP: finds large files

"Find unused TypeScript types"
→ Filesystem MCP + analysis: identifies unused exports
```

---

## Security and Compliance

### Audit Log Analysis

```
"Show me all admin actions from the last week"
→ PostgreSQL MCP: SELECT * FROM audit_logs WHERE user_id IN (SELECT user_id FROM profiles WHERE role IN ('admin', 'super_admin')) AND created_at > NOW() - INTERVAL '7 days'

"Find who deleted agent with ID 'xyz'"
→ PostgreSQL MCP: queries audit_logs with entity_type = 'agent' and action = 'delete'

"Export all user data for user 'abc' (GDPR request)"
→ PostgreSQL MCP: complex join query across all tables
```

### RLS Policy Testing

```
"Test RLS policies for agent role"
→ Supabase MCP: SET ROLE agent; SELECT * FROM properties

"Verify agents can only see their own data"
→ PostgreSQL MCP: executes test queries with different user contexts
```

---

## Performance Optimization

### Query Optimization

```
"Show me the explain plan for this query: SELECT * FROM properties WHERE agent_id = 'xyz'"
→ PostgreSQL MCP: EXPLAIN ANALYZE query

"Suggest indexes for improving property search by postcode"
→ PostgreSQL MCP: analyzes and recommends CREATE INDEX

"Show me table bloat statistics"
→ PostgreSQL MCP: queries pg_stat_user_tables
```

---

## Useful Query Templates

### Agent Statistics

```sql
-- Total properties per agent
SELECT a.id, a.subdomain, COUNT(p.id) as property_count
FROM agents a
LEFT JOIN properties p ON a.id = p.agent_id
GROUP BY a.id, a.subdomain
ORDER BY property_count DESC;

-- Agents with pending content submissions
SELECT a.id, a.subdomain, COUNT(c.id) as pending_count
FROM agents a
JOIN content_submissions c ON a.id = c.agent_id
WHERE c.status = 'pending_review'
GROUP BY a.id, a.subdomain;

-- Build queue status by agent
SELECT a.subdomain, bq.status, COUNT(*) as count
FROM agents a
JOIN build_queue bq ON a.id = bq.agent_id
GROUP BY a.subdomain, bq.status;
```

You can ask PostgreSQL MCP to run any of these directly!

---

## Common MCP Commands Cheat Sheet

### Git
- `git status` → "Show git status"
- `git branch` → "List all branches"
- `git diff` → "Show uncommitted changes"
- `git commit` → "Commit files with message 'xyz'"
- `git push` → "Push current branch"

### Database
- `DESCRIBE table` → "Show schema for [table]"
- `SELECT` → "Query [table] where [condition]"
- `INSERT` → "Insert row into [table]"
- `EXPLAIN` → "Explain this query: [query]"

### GitHub
- `gh pr list` → "List all pull requests"
- `gh issue create` → "Create issue titled 'xyz'"
- `gh workflow list` → "Show GitHub Actions workflows"

### Files
- `cat file` → "Read [file path]"
- `ls directory` → "List files in [directory]"
- `mkdir` → "Create directory [path]"
- `touch file` → "Create file [path]"

### Mapbox
- Geocode → "Convert address to coordinates"
- Route → "Find route from A to B"
- POI → "Find nearby [category]"
- Isochrone → "Generate travel time polygon"

---

## Advanced Patterns

### Automated Code Review

```
You: "Review the changes in my current branch and suggest improvements"
→ Git MCP: gets diff
→ Claude: analyzes code
→ Filesystem MCP: can make suggested changes

You: "Check if there are any SQL injection vulnerabilities in the API routes"
→ Filesystem MCP: reads API routes
→ Claude: security analysis

You: "Verify all database queries use parameterized queries"
→ Filesystem MCP: scans codebase for SQL
```

### Data Migration

```
You: "Export all agents to JSON for backup"
→ PostgreSQL MCP: SELECT * FROM agents → save to file

You: "Import test data from seed.sql"
→ Supabase MCP: runs seed file

You: "Sync production schema to development"
→ Supabase MCP: compares schemas, generates migrations
```

---

## Time-Saving Shortcuts

Instead of manually:
- Switching to terminal for git commands
- Opening GitHub web interface
- Using database GUI tools
- Writing curl commands for APIs

You can just ask Claude with natural language!

**Example Comparison**:

**Manual Way** (5 steps, 2 minutes):
1. Open terminal
2. Type `git checkout -b feature/new-ui`
3. Open VS Code
4. Create file manually
5. Return to terminal for git commands

**With MCP** (1 command, 5 seconds):
```
"Create branch feature/new-ui and add base component file for agent UI"
```
→ Git MCP + Filesystem MCP: Done!

---

## Best Practices

### 1. Start Simple

Don't try to use all servers at once. Start with:
- Filesystem (read project files)
- Git (basic operations)
- Then add more as needed

### 2. Verify Before Destructive Operations

Always review before:
- Database modifications (DROP, DELETE, UPDATE)
- Git pushes to main branch
- Deployment triggers
- Email sends

### 3. Use Read-Only Mode for Learning

Start Supabase and PostgreSQL in read-only mode:
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?read_only=true"
}
```

### 4. Keep Credentials Secure

Never hardcode API keys in config - use environment variables:
```json
"env": {
  "API_KEY": "${API_KEY}"
}
```

---

## Troubleshooting Common Issues

### "MCP server not responding"

- Restart Claude Desktop
- Check config JSON is valid
- Verify command exists: `which git-mcp-server`
- Check logs: `~/Library/Logs/Claude/`

### "PostgreSQL connection failed"

- Verify connection string
- Test with psql command-line
- Check database is accessible (not paused)
- Verify password is correct

### "GitHub authentication failed"

- Try re-authenticating via OAuth
- Check GitHub permissions
- Verify network connection

---

## Summary

**With MCP servers configured, Claude becomes your**:
- Git/GitHub assistant
- Database administrator
- File system manager
- API tester
- Deployment monitor
- Documentation searcher
- Testing automator

**All via natural language!**

**Next**: Follow `MCP_QUICK_START.md` to set up essential servers in 15 minutes, then continue with cloud setup.
