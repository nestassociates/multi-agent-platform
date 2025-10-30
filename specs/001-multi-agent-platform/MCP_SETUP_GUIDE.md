# MCP Server Setup Guide - Complete Installation

**Date**: 2025-10-29
**Purpose**: Set up AI-powered development assistance via MCP servers
**Estimated Time**: 1-2 hours

---

## What are MCP Servers?

MCP (Model Context Protocol) servers extend Claude's capabilities by providing:
- **Direct API access** to services (GitHub, Supabase, Vercel)
- **Database operations** (PostgreSQL with PostGIS)
- **File and Git operations** with security controls
- **External integrations** (Mapbox, Resend, Slack)
- **Development tools** (Testing, documentation, diagnostics)

**Benefits for this project**:
- Manage GitHub repos and PRs without leaving Claude
- Run SQL queries on Supabase database
- Deploy and monitor on Vercel
- Execute Git operations with natural language
- Access up-to-date framework documentation

---

## Configuration File Location

### Claude Desktop (macOS)

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Claude Desktop (Windows)

```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### Template Provided

We've created a template in your project:
```
/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest/mcp-config.template.json
```

---

## Installation Plan (Tiered Approach)

### Tier 1: Essential Servers (Install First - 30 min)

These provide core functionality for daily development:

1. **GitHub MCP Server** - Repository and code management
2. **Supabase MCP Server** - Database operations
3. **Filesystem MCP Server** - File operations
4. **Git MCP Server** - Version control

### Tier 2: High-Value Servers (Add Next - 30 min)

These enhance specific workflows:

5. **Vercel MCP Server** - Deployment management
6. **PostgreSQL MCP Server** - Direct database access with PostGIS
7. **Mapbox MCP Server** - Geospatial operations
8. **Next.js DevTools MCP** - Next.js development

### Tier 3: Utility Servers (Optional - 20 min)

Nice-to-have enhancements:

9. **Astro Docs MCP** - Framework documentation
10. **Playwright MCP** - Browser testing
11. **Memory MCP** - Context persistence
12. **Resend MCP** - Email operations

### Tier 4: Additional Utilities (As Needed)

13. **Fetch MCP** - Web content fetching
14. **Time MCP** - Timezone handling

---

## Prerequisites

Before setting up MCP servers:

### Install Required Global Tools

```bash
# Node.js and npm (already installed)
node --version  # Should be 18.17.0+

# Install global MCP servers
npm install -g postgres-mcp
npm install -g git-mcp-server
npm install -g @microsoft/playwright-mcp

# Install GitHub CLI (optional but helpful)
brew install gh
```

### Gather API Credentials

You'll need these (from your cloud setup):

- ✅ **Supabase**: Project URL and API keys
- ✅ **Mapbox**: Access token
- ✅ **Resend**: API key
- ⏳ **GitHub**: Personal Access Token (optional for remote)
- ⏳ **Vercel**: OAuth (automatic)

---

## Step-by-Step Setup

### Step 1: Create MCP Configuration File

```bash
# Create config directory if it doesn't exist
mkdir -p ~/Library/Application\ Support/Claude

# Copy template to Claude config location
cp "mcp-config.template.json" ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 2: Replace Placeholders with Real Values

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and replace:

**Database Connection** (postgres server):
```json
"args": ["postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"]
```

Get from Supabase:
- Settings → Database → Connection String → URI
- Replace `[password]` with your database password
- Replace `[project-ref]` with your project ref

**Mapbox Token** (mapbox server):
```json
"env": {
  "MAPBOX_ACCESS_TOKEN": "pk.eyJ1..." // Your actual token
}
```

**Resend Email** (resend server):

First, clone and build the Resend MCP server:
```bash
mkdir -p ~/.mcp-servers
cd ~/.mcp-servers
git clone https://github.com/resend/mcp-send-email.git
cd mcp-send-email
npm install
npm run build
```

Then in config:
```json
"args": ["/Users/dan/.mcp-servers/mcp-send-email/build/index.js"],
"env": {
  "RESEND_API_KEY": "re_...", // Your actual API key
  "SENDER_EMAIL_ADDRESS": "noreply@nestassociates.com",
  "REPLY_TO_EMAIL_ADDRESS": "dev@nestassociates.com"
}
```

### Step 3: Configure Project-Specific Supabase

Update Supabase URL to scope to your project:

```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
}
```

Find your project ref: Supabase → Settings → General → Reference ID

### Step 4: Restart Claude Desktop

```bash
# Close Claude Desktop completely
# Reopen Claude Desktop
# MCP servers will initialize automatically
```

### Step 5: Verify MCP Servers Are Working

In Claude Desktop, you should see MCP server indicators (small icons or badges showing connected servers).

Test each server:

**Test GitHub**:
```
List the branches in Nest-Associates/multi-agent-platform repository
```

**Test Supabase**:
```
Show me the tables in my Supabase project
```

**Test Filesystem**:
```
List files in the apps/dashboard directory
```

**Test Git**:
```
Show me the current git status
```

---

## Complete MCP Configuration (Copy-Paste Ready)

### Minimal Configuration (Tier 1 Only)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=false"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"
      ]
    },
    "git": {
      "command": "git-mcp-server",
      "args": [
        "--repository",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"
      ]
    }
  }
}
```

### Full Configuration (All Recommended Servers)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=false"
    },
    "vercel": {
      "type": "http",
      "url": "https://mcp.vercel.com/"
    },
    "postgres": {
      "command": "postgres-mcp",
      "args": ["postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest/specs:ro"
      ]
    },
    "git": {
      "command": "git-mcp-server",
      "args": [
        "--repository",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"
      ]
    },
    "mapbox": {
      "command": "npx",
      "args": ["-y", "@mapbox/mcp-server"],
      "env": {
        "MAPBOX_ACCESS_TOKEN": "YOUR_MAPBOX_TOKEN"
      }
    },
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "astro-docs": {
      "type": "http",
      "url": "https://mcp.docs.astro.build/mcp"
    },
    "playwright": {
      "command": "playwright-mcp"
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

---

## Environment Variables for MCP Servers

Create `~/.mcp-env` file with your credentials:

```bash
# Supabase
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_DATABASE_URL="postgresql://postgres:password@db.ref.supabase.co:5432/postgres"

# Mapbox
export MAPBOX_ACCESS_TOKEN="pk.eyJ1..."

# Resend
export RESEND_API_KEY="re_..."
export SENDER_EMAIL="noreply@nestassociates.com"
export REPLY_TO_EMAIL="dev@nestassociates.com"
```

Then source it:
```bash
# Add to your ~/.zshrc or ~/.bash_profile
source ~/.mcp-env
```

---

## Server-Specific Setup Instructions

### 1. GitHub MCP Server (No Setup Required!)

**Type**: Remote hosted (OAuth automatic)

**What you can do**:
- "Create a new issue for bug tracking"
- "List all open PRs"
- "Create PR from 001-multi-agent-platform to main"
- "Show GitHub Actions workflow status"
- "Search for TODO comments in codebase"

**No additional setup needed** - works out of the box!

---

### 2. Supabase MCP Server (No Local Install!)

**Type**: Remote hosted (OAuth automatic)

**Configuration Options**:

**Basic** (full access, all projects):
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp"
}
```

**Project-Scoped** (recommended):
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=abcdefghijklmnop"
}
```

**Read-Only Mode** (safe for learning):
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=abcdefghijklmnop&read_only=true"
}
```

**What you can do**:
- "Show me all tables in the database"
- "Create a migration to add a new column"
- "Run this SQL query: SELECT * FROM agents LIMIT 5"
- "Generate TypeScript types from database schema"
- "Show me the logs from the last hour"

**Get Project Ref**:
- Supabase Dashboard → Settings → General → Reference ID

---

### 3. Filesystem MCP Server (Built-in via npx)

**Installation**: Automatic via npx (no manual install)

**Configuration**:
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest",
    "/path/to/specs:ro"
  ]
}
```

**Security**:
- First path: Full read/write access
- Paths with `:ro`: Read-only access
- Can specify multiple directories

**What you can do**:
- "Read the contents of apps/dashboard/package.json"
- "Create a new file in apps/dashboard/components"
- "Search for 'TODO' comments in the codebase"

---

### 4. Git MCP Server (Requires npm install)

**Installation**:
```bash
npm install -g git-mcp-server
```

**Configuration**:
```json
"git": {
  "command": "git-mcp-server",
  "args": [
    "--repository",
    "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"
  ]
}
```

**What you can do**:
- "Show me git status"
- "Create a new branch called feature/agent-ui"
- "Show diff of uncommitted changes"
- "Commit staged files with message 'feat: add agent UI'"
- "Push current branch to origin"

---

### 5. Vercel MCP Server (No Setup Required!)

**Type**: Remote hosted (OAuth automatic)

**What you can do**:
- "List all Vercel projects"
- "Show deployments for multi-agent-platform"
- "Show deployment logs for the latest deployment"
- "Search Vercel documentation for cron jobs"

**No additional setup needed** - OAuth handled automatically!

---

### 6. PostgreSQL MCP Server (Requires npm install)

**Installation**:
```bash
npm install -g postgres-mcp
```

**Configuration**:
```json
"postgres": {
  "command": "postgres-mcp",
  "args": ["postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres"]
}
```

**Get Connection String**:
- Supabase → Settings → Database → Connection string → URI
- Copy and replace password

**What you can do**:
- "Show me all tables with row counts"
- "Run spatial query to find properties within 5km of coordinates"
- "Optimize slow queries and suggest indexes"
- "Execute this SQL: SELECT * FROM agents WHERE status = 'active'"
- "Show database health metrics"

**Features**:
- 63 AI-native tools
- PostGIS geospatial operations ⭐
- Query optimization
- EXPLAIN ANALYZE
- Index tuning
- JSONB operations

---

### 7. Mapbox MCP Server (Requires setup)

**Installation**: Automatic via npx

**Setup Environment Variable**:
```bash
# Add to ~/.zshrc or ~/.bash_profile
export MAPBOX_ACCESS_TOKEN="pk.eyJ1..."
```

Or set in MCP config directly (see template).

**Configuration**:
```json
"mapbox": {
  "command": "npx",
  "args": ["-y", "@mapbox/mcp-server"],
  "env": {
    "MAPBOX_ACCESS_TOKEN": "pk.eyJ1..."
  }
}
```

**What you can do**:
- "Geocode this address: 123 High Street, London"
- "Find route from point A to point B by car"
- "Search for restaurants within 1km of coordinates"
- "Generate 30-minute driving isochrone from this location"
- "Calculate travel time matrix between these 5 addresses"
- "Create static map image of this area"

**8 Tools Available**:
1. DirectionsTool (multi-modal routing)
2. ForwardGeocodeTool (address → coordinates)
3. ReverseGeocodeTool (coordinates → address)
4. POISearchTool (nearby places)
5. CategorySearchTool (businesses by type)
6. IsochroneTool (travel time areas)
7. MatrixTool (distance/duration matrices)
8. StaticMapTool (map image generation)

---

### 8. Resend Email MCP Server (Requires manual setup)

**Installation**:
```bash
# Create MCP servers directory
mkdir -p ~/.mcp-servers
cd ~/.mcp-servers

# Clone and build Resend MCP server
git clone https://github.com/resend/mcp-send-email.git
cd mcp-send-email
npm install
npm run build
```

**Configuration**:
```json
"resend": {
  "command": "node",
  "args": ["/Users/dan/.mcp-servers/mcp-send-email/build/index.js"],
  "env": {
    "RESEND_API_KEY": "re_...",
    "SENDER_EMAIL_ADDRESS": "noreply@nestassociates.com",
    "REPLY_TO_EMAIL_ADDRESS": "dev@nestassociates.com"
  }
}
```

**What you can do**:
- "Send test email to developer@example.com"
- "Schedule welcome email for tomorrow at 9am"
- "Send email with CC to team@example.com"

---

### 9. Next.js DevTools MCP (Built-in via npx)

**Installation**: Automatic via npx

**What you can do**:
- "Check for Next.js updates and suggest upgrade path"
- "Setup Next.js cache components"
- "Launch browser test for this component"
- "Show Next.js dev server diagnostics"
- "Search Next.js documentation for App Router"

---

### 10. Astro Docs MCP (No Setup Required!)

**Type**: Remote hosted

**What you can do**:
- "How do I handle dynamic routes in Astro?"
- "Show me Astro Image component documentation"
- "What's new in Astro 4.x?"
- "How do I integrate React components in Astro?"

---

### 11. Playwright MCP (Requires npm install)

**Installation**:
```bash
npm install -g @microsoft/playwright-mcp
playwright install  # Install browsers
```

**What you can do**:
- "Test the login flow on localhost:3000"
- "Take screenshot of the dashboard homepage"
- "Navigate to /agents and click the create button"
- "Run accessibility tests on this page"

---

### 12. Memory MCP Server (Built-in via npx)

**Installation**: Automatic via npx

**What you can do**:
- "Remember that we're using dual API strategy for Apex27"
- "What did we decide about the database schema for territories?"
- "Store this architectural decision for future reference"

**Benefits**:
- Builds knowledge graph of your project
- Remembers decisions across sessions
- Maintains context better

---

## Complete Setup Checklist

Use this to track your MCP server setup:

### Pre-Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm available
- [ ] Claude Desktop installed
- [ ] Supabase project created
- [ ] API keys gathered (Mapbox, Resend, etc.)

### Tier 1: Essential Servers
- [ ] GitHub MCP - Added to config (no install needed)
- [ ] Supabase MCP - Added to config with project ref
- [ ] Filesystem MCP - Added to config with project path
- [ ] Git MCP - Installed globally (`npm install -g git-mcp-server`)
- [ ] Git MCP - Added to config with repo path
- [ ] Config file created at `~/Library/Application Support/Claude/claude_desktop_config.json`
- [ ] Claude Desktop restarted

### Tier 2: High-Value Servers
- [ ] Vercel MCP - Added to config (no install needed)
- [ ] PostgreSQL MCP - Installed globally (`npm install -g postgres-mcp`)
- [ ] PostgreSQL MCP - Added to config with Supabase connection string
- [ ] Mapbox MCP - Mapbox token added to config
- [ ] Next.js DevTools - Added to config (npx auto-install)

### Tier 3: Utility Servers
- [ ] Astro Docs MCP - Added to config (no install needed)
- [ ] Playwright MCP - Installed globally
- [ ] Playwright browsers installed (`playwright install`)
- [ ] Memory MCP - Added to config (npx auto-install)
- [ ] Resend MCP - Repo cloned to ~/.mcp-servers
- [ ] Resend MCP - Built (`npm install && npm run build`)
- [ ] Resend MCP - Added to config with API key

### Verification
- [ ] Claude Desktop shows MCP server indicators
- [ ] GitHub MCP: Can list repositories
- [ ] Supabase MCP: Can query database
- [ ] Filesystem MCP: Can read project files
- [ ] Git MCP: Can show git status
- [ ] PostgreSQL MCP: Can run SQL queries
- [ ] Mapbox MCP: Can geocode addresses

---

## Example Usage Patterns for Your Project

### Managing GitHub

```
You: "Create a PR from 001-multi-agent-platform to main with title 'Complete Foundation Setup'"

You: "List all open issues in the repository"

You: "Create an issue for implementing User Story 1 (Agent Creation)"
```

### Working with Supabase

```
You: "Show me the schema for the agents table"

You: "Run SQL: SELECT COUNT(*) FROM properties WHERE agent_id = 'xyz'"

You: "Create a migration to add email_verified column to profiles table"

You: "Generate TypeScript types from the current database schema"
```

### Database Operations

```
You: "Find all properties within 10km of latitude 51.5074, longitude -0.1278"

You: "Optimize the query performance for fetching agent properties"

You: "Show me slow queries from the last 24 hours"

You: "Check if PostGIS extension is enabled"
```

### Mapbox Integration

```
You: "Geocode the address: 123 High Street, London SW1A 1AA"

You: "Find the route from Leeds to York by car"

You: "Show me all cafes within 1km of coordinates 53.8008, -1.5491"

You: "Generate a 15-minute driving isochrone from this location"
```

### File Operations

```
You: "Read the package.json in apps/dashboard"

You: "Create a new component file at apps/dashboard/components/admin/agent-table.tsx"

You: "Show me all TypeScript files in packages/validation"
```

### Git Operations

```
You: "Show me the diff between main and current branch"

You: "Create a new branch called feature/territory-ui"

You: "Commit all staged files with message 'feat: add territory mapping UI'"

You: "Show me the commit history for the last 10 commits"
```

### Deployment

```
You: "Show me the latest deployment status on Vercel"

You: "List all deployments for the dashboard project"

You: "Show me the build logs for the failed deployment"
```

---

## Troubleshooting

### MCP Servers Not Showing

**Issue**: No MCP server indicators in Claude Desktop

**Solutions**:
1. Check config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Validate JSON syntax (use https://jsonlint.com/)
3. Check logs: `~/Library/Logs/Claude/mcp*.log`
4. Restart Claude Desktop completely
5. Try minimal config first (Tier 1 only)

### Server Failed to Start

**Issue**: Specific MCP server shows error

**Solutions**:
1. Check command exists: `which git-mcp-server`
2. Check Node.js version: `node --version` (need 18+)
3. Verify paths are correct (absolute paths required)
4. Check environment variables are set
5. Try running command manually to see error

### PostgreSQL Connection Failed

**Issue**: postgres-mcp can't connect to Supabase

**Solutions**:
1. Verify connection string format
2. Check database password is correct
3. Test connection with psql:
   ```bash
   psql "postgresql://postgres:password@db.ref.supabase.co:5432/postgres"
   ```
4. Check firewall/network allows connection
5. Try with read-only connection first

### Mapbox Token Invalid

**Issue**: Mapbox MCP server shows authentication error

**Solutions**:
1. Verify token starts with `pk.` (public token)
2. Check token hasn't expired
3. Verify token permissions in Mapbox dashboard
4. Try creating new token

---

## Security Best Practices

### 1. Use Read-Only Mode for Learning

Start Supabase and PostgreSQL in read-only mode:
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?read_only=true"
}
```

### 2. Scope to Development Projects Only

Never connect to production databases:
```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=DEV_PROJECT_REF"
}
```

### 3. Use Directory Restrictions

Limit filesystem access:
```json
"filesystem": {
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/path/to/project",      // Read/write
    "/path/to/docs:ro"       // Read-only
  ]
}
```

### 4. Store Credentials Securely

**Never** hardcode credentials in config:
```json
// Bad ❌
"env": {
  "API_KEY": "actual-key-here"
}

// Good ✅
"env": {
  "API_KEY": "${API_KEY}"  // From environment variable
}
```

### 5. Review Actions Before Execution

Always review what the AI plans to do, especially for:
- Database modifications
- Git pushes
- File deletions
- Email sends

---

## Benefits for Your Project

### With These MCP Servers, You Can:

**Development Workflow**:
- "Create agent creation form component and commit to feature branch"
- "Run database migration and verify schema"
- "Deploy dashboard to Vercel and check logs"

**Database Management**:
- "Show me all agents with their property counts"
- "Find territories overlapping with agent ID xyz"
- "Optimize the properties table indexes"

**Code Management**:
- "Create PR for completed User Story 1"
- "Review diffs and suggest improvements"
- "Merge feature branch after tests pass"

**Geospatial Operations**:
- "Geocode all property addresses in the database"
- "Calculate driving distances between agent offices"
- "Generate territory coverage maps"

**Deployment**:
- "Deploy latest changes to Vercel"
- "Check build status and errors"
- "Rollback to previous deployment"

**Testing**:
- "Run Playwright tests on login flow"
- "Test agent creation end-to-end"
- "Take screenshots of all dashboard pages"

---

## Quick Start (Minimal Setup - 15 minutes)

For fastest start, install just Tier 1:

### 1. Create Config File

```bash
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?read_only=true"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"
      ]
    }
  }
}
EOF
```

### 2. Install Git MCP

```bash
npm install -g git-mcp-server
```

### 3. Add Git to Config

Open `~/Library/Application Support/Claude/claude_desktop_config.json` and add:
```json
"git": {
  "command": "git-mcp-server",
  "args": ["--repository", "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"]
}
```

### 4. Restart Claude Desktop

### 5. Test

```
You: "Show me the current git status"
You: "List files in the apps directory"
You: "Connect to my Supabase project"
```

---

## Adding More Servers Later

You can add servers incrementally:

1. Edit config file: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add new server entry
3. Restart Claude Desktop
4. Test new server

**No need to set up everything at once!** Start with Tier 1, add more as needed.

---

## Next Steps

After MCP setup:

1. ✅ **Test each server** with simple commands
2. ✅ **Authenticate with GitHub** (for git push)
3. ✅ **Continue cloud setup** (`CLOUD_SETUP_GUIDE.md`)
4. ✅ **Start implementing** user stories with MCP-powered assistance

**With MCP servers, I can help you**:
- Push code to GitHub
- Create and manage Supabase migrations
- Deploy to Vercel
- Run database queries
- Execute Git operations
- Test with Playwright
- And much more - all via natural language!

---

## Summary

**Recommended Setup** (Complete):
- 14 MCP servers configured
- GitHub, Supabase, Vercel (remote, OAuth)
- Database, filesystem, Git (local tools)
- Mapbox, Resend, Playwright (integrations)
- Next.js, Astro docs (framework help)
- Memory, Fetch, Time (utilities)

**Minimal Setup** (Quick Start):
- 4 MCP servers (GitHub, Supabase, Filesystem, Git)
- 15 minutes setup time
- Core functionality ready

**Choose your approach** based on time available. You can always add more servers later!
