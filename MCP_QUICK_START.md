# MCP Quick Start - Essential Setup (15 Minutes)

**Purpose**: Get the 4 most important MCP servers running ASAP
**Time**: 15 minutes
**Result**: GitHub, Supabase, Filesystem, and Git operations via Claude

---

## What You're Setting Up

1. **GitHub MCP** - Manage repos, PRs, issues
2. **Supabase MCP** - Database operations
3. **Filesystem MCP** - Read/write project files
4. **Git MCP** - Version control operations

---

## Step 1: Install Git MCP Server (2 min)

```bash
npm install -g git-mcp-server
```

Verify installation:
```bash
which git-mcp-server
# Should show: /usr/local/bin/git-mcp-server (or similar)
```

---

## Step 2: Create MCP Configuration File (5 min)

```bash
# Create config file
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
EOF
```

---

## Step 3: Restart Claude Desktop (1 min)

1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. Wait for MCP servers to initialize (~10 seconds)

---

## Step 4: Test Each Server (5 min)

Try these commands in Claude:

### Test GitHub
```
List branches in the Nest-Associates/multi-agent-platform repository
```

Expected: Should show branches or prompt for OAuth authentication

### Test Supabase
```
Show me what Supabase projects I have access to
```

Expected: Should prompt for OAuth authentication, then show projects

### Test Filesystem
```
List all package.json files in my project
```

Expected: Should show package.json files in apps/ and packages/

### Test Git
```
Show me the current git status
```

Expected: Should show branch name, staged/unstaged files

---

## Step 5: Authenticate Services (As Needed)

### GitHub
- First use will prompt for OAuth
- Authenticate via browser
- Permissions granted automatically

### Supabase
- First use will prompt for OAuth
- Authenticate via browser
- Select project to work with

---

## What You Can Do Now

### GitHub Operations
- "Create a PR from my feature branch to main"
- "List all open issues"
- "Create an issue for implementing agent dashboard"

### Supabase Operations
- "Show me all tables in the database"
- "Run query: SELECT * FROM profiles LIMIT 5"
- "Create a migration to add a column"

### File Operations
- "Read apps/dashboard/package.json"
- "Show me all TypeScript files in packages/validation"
- "Create a new file in apps/dashboard/components"

### Git Operations
- "Show me uncommitted changes"
- "Create a new branch called feature/test"
- "Commit these files with message 'test commit'"
- "Show git log"

---

## Add More Servers Later

When you're ready, add more servers from the full configuration:

**Edit**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Add** servers from `mcp-config.template.json` in your project root

**Restart** Claude Desktop

---

## Next: Full Setup (Optional)

See `specs/001-multi-agent-platform/MCP_SETUP_GUIDE.md` for:
- Complete 14-server configuration
- PostgreSQL with PostGIS
- Mapbox geospatial operations
- Vercel deployment management
- Resend email integration
- Playwright testing
- And more...

---

## Troubleshooting

### Config File Not Found

```bash
# Check if directory exists
ls ~/Library/Application\ Support/Claude/

# If not, create it
mkdir -p ~/Library/Application\ Support/Claude/
```

### Git MCP Server Not Found

```bash
# Reinstall
npm uninstall -g git-mcp-server
npm install -g git-mcp-server

# Verify
git-mcp-server --version
```

### No MCP Servers Showing in Claude

1. Check config file exists and has valid JSON
2. Try minimal config with just one server
3. Check Claude Desktop logs: `~/Library/Logs/Claude/`
4. Restart Claude Desktop

---

## You're Done! ✅

With these 4 essential MCP servers, Claude can now:
- ✅ Manage your GitHub repository
- ✅ Query and modify your Supabase database
- ✅ Read and write project files
- ✅ Perform Git operations

**Total setup time**: ~15 minutes
**Value**: Massive productivity boost for the entire project!

**Now continue with**: Cloud setup and pushing to GitHub!
