# Web Agent Credentials Reference

**Purpose**: This file contains all credentials and access information needed to complete Phase 4 tasks via GitHub web interface.

---

## Apex27 API Access

### Main API (Primary - Use This)
- **Base URL**: `https://api.apex27.co.uk`
- **API Key**: `e66d531515e195b90f38975e0a7e2d75`
- **Authentication**: Header `X-Api-Key: e66d53151...`
- **Request Type**: GET
- **Features**: Webhooks supported, full data access, structured flags

**Test Command**:
```bash
curl -X GET 'https://api.apex27.co.uk/listings?page=1&pageSize=5' \
  -H 'X-Api-Key: e66d531515e...'
```

### Portal API (Optional - Reference Only)
- **Base URL**: `https://portals-60b92e71.apex27.co.uk`
- **API Key**: `9836a3...`
- **Authentication**: Form body `api_key=9836...`
- **Request Type**: POST
- **Features**: Marketed properties only (188), no webhooks

---

## Supabase Access

**Project**: Nest Associates Multi-Agent Platform
- **Project URL**: `https://mdxusjaxhypvuprmzgif.supabase.co`
- **Anon Key**: `eyJhbGc...`
- **Service Role Key**: `eyJhbGci...`

**MCP Server**: You have access via Supabase MCP tools
- Use `mcp__supabase__execute_sql` for queries
- Use `mcp__supabase__apply_migration` for schema changes
- Use `mcp__supabase__list_tables` to explore schema

**Test Agent ID**: `5d5a7d6f-4d38-4dce-941a-564b94cf7f2d`

**SQL to Update Agent**:
```sql
UPDATE agents
SET apex27_branch_id = '710'
WHERE id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

**SQL to Verify Properties**:
```sql
SELECT COUNT(*) FROM properties
WHERE agent_id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d';
```

---

## GitHub Access

**Repository**: `https://github.com/nestassociates/multi-agent-platform`

You have GitHub MCP tools available:
- `mcp__github__get_file_contents` - Read files
- `mcp__github__create_or_update_file` - Edit files
- `mcp__github__push_files` - Commit multiple files

---

## Vercel Access

**Project**: `multi-agent-platform-eight`
- **Team ID**: `team_hLO7CqM8S34lWfYl4ZXYApJO`
- **Project ID**: `prj_yFDkA5vu7x4w63K8n7Rkp43hDPtz`
- **URL**: https://multi-agent-platform-eight.vercel.app

**MCP Tools Available**:
- `mcp__vercel__get_project` - Get project details
- `mcp__vercel__list_deployments` - Check deployment status
- `mcp__vercel__get_deployment_build_logs` - View build logs

**Note**: To add environment variables, you'll need to guide the user to do it via Vercel Dashboard (MCP tools don't support env var management).

---

## Other Services

### Mapbox
- **Access Token**: `pk.eyJ1IjoibmVzdGFzc29jaWF0...`

### Resend (Email)
- **API Key**: `re_ZcEDb4H8_73v...`
- **From Email**: `noreply@nestassociates.co.uk`

### OS Data Hub
- **API Key**: `2IQxYrJUY...`
- **API Secret**: `kZpbVf6aIPadQsMQ`

### Cron Security
- **Secret**: `a8145ade729160...`

---

## Key Files to Edit

For Task #1 (Add status filter):
- **File**: `apps/dashboard/lib/apex27/client.ts`
- **Location**: Lines 19-23 (GetListingsOptions interface)
- **Location**: Lines 48-50 (query params construction)

---

## Testing Workflow

### 1. Test API Directly
Use curl commands from TODO.md - these work from anywhere

### 2. Update Database
Use Supabase MCP tools:
```typescript
mcp__supabase__execute_sql({
  query: "UPDATE agents SET apex27_branch_id = '710' WHERE id = '5d5a7d6f-4d38-4dce-941a-564b94cf7f2d'"
})
```

### 3. Verify Changes
Use GitHub MCP to read/edit files:
```typescript
mcp__github__get_file_contents({
  owner: "nestassociates",
  repo: "multi-agent-platform",
  path: "apps/dashboard/lib/apex27/client.ts"
})
```

### 4. Commit Changes
Use GitHub MCP to push:
```typescript
mcp__github__create_or_update_file({
  owner: "nestassociates",
  repo: "multi-agent-platform",
  path: "apps/dashboard/lib/apex27/client.ts",
  content: "...",
  message: "feat: add status filter to Main API client",
  branch: "main"
})
```

---

## Success Indicators

After completing all tasks:
- ✅ API returns ~200 properties (not 10,880)
- ✅ Test agent has branch_id = '710'
- ✅ Properties table has records for test agent
- ✅ Webhook registered in Apex27
- ✅ Vercel deployment succeeds with new env var

---

## Troubleshooting

**If MCP tools aren't working**:
- Read files using GitHub MCP
- Edit files using GitHub MCP
- Test APIs using curl (no auth needed for Apex27 Main API testing)

**If database access fails**:
- Use `mcp__supabase__execute_sql` tool
- Project is already connected via MCP

**If Vercel access fails**:
- Use `mcp__vercel__get_project` to verify connection
- For env vars, user must add manually via dashboard
