# Cloud Services Setup Guide

**Feature**: Multi-Agent Real Estate Platform
**Date**: 2025-10-29
**Estimated Setup Time**: 2-3 hours

## Overview

This guide walks you through setting up all required cloud services for the Multi-Agent Real Estate Platform. Complete these steps before continuing development.

---

## Required Services Summary

| Service | Purpose | Cost (Estimated) | Priority |
|---------|---------|------------------|----------|
| **GitHub** | Source control, CI/CD | Free (public/private repos) | Required |
| **Supabase** | Database, Auth, Storage | $25/month (Pro plan) | Required |
| **Vercel** | Hosting dashboards + agent sites | $20/month (Pro) | Required |
| **Resend** | Transactional emails | Free tier (3k/month) → $20/month | Required |
| **Mapbox** | Territory maps | Free tier (50k loads/month) | Required |
| **OS Data Hub** | UK property counts | Free (600 req/min) | Required |
| **Sentry** | Error tracking | Free tier (5k events/month) | Recommended |
| **Google Analytics** | Site analytics | Free | Optional |

**Total Monthly Cost**: ~$65-85/month (with free tiers)

---

## 1. GitHub Setup

**Purpose**: Source control, collaboration, CI/CD pipelines

### Steps

1. **Create GitHub Account** (if you don't have one)
   - Go to [https://github.com/signup](https://github.com/signup)
   - Complete registration

2. **Create Organization** (recommended for team collaboration)
   - Click profile icon → "Your organizations" → "New organization"
   - Name: `nest-associates` (or your company name)
   - Plan: Free (or Team for $4/user/month for advanced features)

3. **Create Repository**
   - Go to [https://github.com/new](https://github.com/new)
   - Owner: Select your organization or personal account
   - Repository name: `multi-agent-platform`
   - Visibility: **Private** (recommended)
   - Do NOT initialize with README (we already have one)
   - Click "Create repository"

4. **Push Your Code**
   ```bash
   # In your project directory
   git remote add origin https://github.com/YOUR_ORG/multi-agent-platform.git
   git add .
   git commit -m "feat: initial monorepo setup with database foundation"
   git push -u origin main
   ```

5. **Configure Branch Protection** (optional but recommended)
   - Go to repository → Settings → Branches
   - Click "Add rule"
   - Branch name pattern: `main`
   - Enable: "Require pull request reviews before merging"
   - Enable: "Require status checks to pass before merging"
   - Click "Create"

### What You'll Need Later
- ✅ Repository URL (for Vercel deployment)
- ✅ GitHub Personal Access Token (for CI/CD)

**Estimated Time**: 15 minutes

---

## 2. Supabase Setup

**Purpose**: PostgreSQL database, authentication, file storage

### Steps

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub (recommended for easy integration)

2. **Create New Project**
   - Click "New Project"
   - Organization: Create new or select existing
   - Project name: `nest-multi-agent-platform`
   - Database Password: Generate a strong password (save it securely!)
   - Region: **United Kingdom** (for UK data residency)
   - Plan: **Pro** ($25/month)
     - Includes: 8GB database, 100GB bandwidth, 100GB storage
     - Daily backups, Point-in-Time Recovery
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get API Credentials**
   - Once project is ready, go to Settings → API
   - Copy these values (you'll need them for .env.local):
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ Keep secret!)

4. **Configure Authentication Settings**
   - Go to Authentication → Settings
   - Site URL: `http://localhost:3000` (change to production URL later)
   - Redirect URLs: Add `http://localhost:3000/**` and `https://your-production-domain.com/**`
   - Email Auth: Enabled
   - Email Confirmations: Disabled (we'll handle in app)
   - Mailer templates: Use default (customize later)
   - JWT Expiry: 3600 seconds (1 hour)
   - Refresh Token Rotation: Enabled
   - Reuse Interval: 10 seconds
   - Click "Save"

5. **Configure Password Policy**
   - Authentication → Settings → Auth Providers → Email
   - Minimum Password Length: 12
   - Password Requirements: (Supabase doesn't enforce regex, we handle in validation)

6. **Enable PostGIS Extension**
   - Go to Database → Extensions
   - Search for "postgis"
   - Click "Enable" on PostGIS extension
   - Wait for confirmation

7. **Run Database Migrations**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase

   # Link to your project
   cd supabase
   supabase link --project-ref YOUR_PROJECT_REF
   # Find project ref in: Settings → General → Reference ID

   # Push all migrations
   supabase db push

   # Verify tables created
   supabase db status
   ```

8. **Create Storage Buckets**
   - Go to Storage → Create bucket
   - Create these buckets:
     1. **avatars** (Public: Yes, File size limit: 5MB, Allowed MIME types: image/*)
     2. **content-images** (Public: Yes, File size limit: 10MB, Allowed MIME types: image/*)
     3. **property-images** (Public: Yes, File size limit: 10MB, Allowed MIME types: image/*)
     4. **documents** (Public: No, File size limit: 50MB, Allowed MIME types: application/pdf)

9. **Configure Storage Policies**
   - For each public bucket, add RLS policies:
   ```sql
   -- Anyone can read
   CREATE POLICY "Public read access"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'avatars');

   -- Authenticated users can upload
   CREATE POLICY "Authenticated upload"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
   ```

10. **Create Admin User**
    - Go to Authentication → Users
    - Click "Add User" (or "Invite User")
    - Email: `admin@nestassociates.com` (or your admin email)
    - Auto-generate password (or set a strong one)
    - Click "Create user"
    - Copy the User ID (UUID)

    - Go to SQL Editor → New Query
    - Run this SQL:
    ```sql
    INSERT INTO profiles (user_id, role, email, first_name, last_name)
    VALUES (
      'paste-user-id-here',
      'super_admin',
      'admin@nestassociates.com',
      'Admin',
      'User'
    );
    ```

### What You'll Copy to .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # ⚠️ Keep secret!
```

**Estimated Time**: 30 minutes

---

## 3. Vercel Setup

**Purpose**: Host Next.js dashboard and Astro agent sites

### Steps

1. **Create Vercel Account**
   - Go to [https://vercel.com/signup](https://vercel.com/signup)
   - Sign up with GitHub (recommended for easy deployment)

2. **Import Dashboard Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `multi-agent-platform`
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `apps/dashboard`
   - Build Command: Leave as default (`next build`)
   - Output Directory: Leave as default (`.next`)
   - Install Command: `npm install` or `npm install --prefix apps/dashboard`

3. **Configure Dashboard Environment Variables**
   - In project settings → Environment Variables
   - Add all variables from `apps/dashboard/.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   APEX27_WEBHOOK_SECRET=(generate random 32-char string)
   OS_DATA_HUB_API_KEY=(from step 6)
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=(from step 5)
   VERCEL_API_TOKEN=(from step 4 below)
   VERCEL_TEAM_ID=(from Account Settings)
   RESEND_API_KEY=(from step 4)
   RESEND_FROM_EMAIL=noreply@nestassociates.com
   NEXT_PUBLIC_SENTRY_DSN=(from step 7, optional)
   NODE_ENV=production
   ```

4. **Get Vercel API Token & Team ID** (for build system)
   - Go to Account Settings → Tokens
   - Click "Create Token"
   - Name: "Multi-Agent Build System"
   - Scope: Full Account (or limit to specific projects)
   - Expiration: No expiration (or set appropriate date)
   - Click "Create Token"
   - **Copy token immediately** (won't be shown again!)

   - Team ID:
     - Go to Team Settings → General
     - Copy "Team ID" field

5. **Configure Custom Domain** (optional for now)
   - Go to project → Settings → Domains
   - Add domain: `agents.nestassociates.com`
   - Follow DNS configuration instructions
   - For wildcard subdomain (agent sites), you'll configure in Cloudflare later

6. **Deploy Dashboard**
   - Push to `main` branch to trigger automatic deployment
   - Or click "Deploy" button in Vercel dashboard
   - Wait for deployment to complete
   - Visit your dashboard URL

### What You'll Copy to .env.local

```bash
VERCEL_API_TOKEN=your-vercel-token
VERCEL_TEAM_ID=team_xxxxx
```

**Estimated Time**: 20 minutes

---

## 4. Resend Setup (Email Service)

**Purpose**: Send transactional emails (welcome, content approved/rejected, etc.)

### Steps

1. **Create Resend Account**
   - Go to [https://resend.com/signup](https://resend.com/signup)
   - Sign up with email or GitHub

2. **Verify Domain** (recommended for better deliverability)
   - Go to Domains → "Add Domain"
   - Domain: `nestassociates.com` (your actual domain)
   - Follow DNS verification instructions:
     - Add TXT record for verification
     - Add SPF, DKIM records
     - Wait for verification (usually 5-15 minutes)

3. **Or Use Resend's Test Domain** (for development)
   - Skip domain verification
   - Use `onboarding@resend.dev` as sender
   - Limited to 100 emails/day
   - ⚠️ Emails may go to spam

4. **Create API Key**
   - Go to API Keys → "Create API Key"
   - Name: "Multi-Agent Platform Production"
   - Permission: "Sending access" (default)
   - Click "Add"
   - **Copy API key immediately** (won't be shown again!)

5. **Configure Sending Email**
   - If domain verified: `noreply@nestassociates.com`
   - If using test domain: `onboarding@resend.dev`

### What You'll Copy to .env.local

```bash
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@nestassociates.com
```

**Pricing**:
- Free tier: 3,000 emails/month, 100/day
- Pro: $20/month for 50,000 emails/month
- Recommended: Start with free tier, upgrade when you hit limits

**Estimated Time**: 15 minutes (+ domain verification wait time)

---

## 5. Mapbox Setup (Maps & Territory Management)

**Purpose**: Interactive territory map with drawing tools

### Steps

1. **Create Mapbox Account**
   - Go to [https://account.mapbox.com/auth/signup](https://account.mapbox.com/auth/signup)
   - Sign up with email or GitHub

2. **Create Access Token**
   - Automatically created on signup, or:
   - Go to Account → Access Tokens
   - Click "Create a token"
   - Name: "Multi-Agent Platform"
   - Scopes: Select all public scopes
   - URL restrictions: Leave empty for development, add production domain later
   - Click "Create token"
   - **Copy token**

3. **Configure Token Restrictions** (for production)
   - Edit token → URL restrictions
   - Add allowed URLs:
     - `http://localhost:3000/*`
     - `https://your-production-domain.com/*`
   - This prevents unauthorized use of your token

### What You'll Copy to .env.local

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoi...
```

**Pricing**:
- Free tier: 50,000 map loads/month
- Pay-as-you-go: $5 per 1,000 loads after free tier
- For admin-only feature (territory management), free tier is sufficient

**Estimated Time**: 10 minutes

---

## 6. OS Data Hub Setup (UK Property Data)

**Purpose**: Calculate residential property counts within territory boundaries

### Steps

1. **Create OS Data Hub Account**
   - Go to [https://osdatahub.os.uk/](https://osdatahub.os.uk/)
   - Click "Sign up for free"
   - Complete registration with email verification

2. **Create API Project**
   - Log in → My Projects
   - Click "Create a new project"
   - Project name: "Nest Multi-Agent Platform"
   - Click "Create project"

3. **Add Features API**
   - In your project, click "Add API"
   - Select "OS Features API"
   - Click "Add to project"

4. **Get API Key**
   - In project details, you'll see "API Key"
   - Click "Show" to reveal
   - **Copy API key**

5. **Understand Limits**
   - Free tier: 600 requests per minute
   - No monthly limit on free tier
   - More than sufficient for territory creation (estimated 50-100 queries/month)

### What You'll Copy to .env.local

```bash
OS_DATA_HUB_API_KEY=your-api-key
```

**Pricing**: Free (600 requests/min is generous)

**Estimated Time**: 15 minutes

---

## 7. Sentry Setup (Error Tracking) - Optional but Recommended

**Purpose**: Track JavaScript errors, API errors, performance issues

### Steps

1. **Create Sentry Account**
   - Go to [https://sentry.io/signup/](https://sentry.io/signup/)
   - Sign up with email or GitHub

2. **Create Project**
   - Select platform: **Next.js**
   - Project name: `nest-multi-agent-platform`
   - Alert frequency: Default
   - Click "Create Project"

3. **Get DSN**
   - After project creation, you'll see setup instructions
   - Copy the DSN (Data Source Name):
     `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

4. **Configure Alerts** (optional)
   - Go to Alerts → Create Alert Rule
   - Condition: Error count > 10 in 5 minutes
   - Action: Email to your team

### What You'll Copy to .env.local

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-auth-token # For source maps upload
```

**Pricing**:
- Free tier: 5,000 errors/month
- Team: $26/month for 50,000 errors/month
- Recommended: Start with free tier

**Estimated Time**: 10 minutes

---

## 8. Google Analytics 4 Setup (Optional)

**Purpose**: Track traffic on agent microsites

### Steps

1. **Create Google Analytics Account**
   - Go to [https://analytics.google.com](https://analytics.google.com)
   - Click "Start measuring"
   - Account name: "Nest Associates"

2. **Create Property**
   - Property name: "Agent Microsites Network"
   - Reporting time zone: United Kingdom
   - Currency: GBP

3. **Create Data Stream**
   - Platform: Web
   - Website URL: `https://*.agents.nestassociates.com` (wildcard)
   - Stream name: "All Agent Sites"

4. **Get Measurement ID**
   - After creating stream, copy **Measurement ID**: `G-XXXXXXXXXX`

5. **Configure Google Tag Manager** (optional)
   - Go to [https://tagmanager.google.com](https://tagmanager.google.com)
   - Create account and container
   - Get Container ID: `GTM-XXXXXXX`
   - This allows non-developers to add tracking tags

### What You'll Copy to .env.local

```bash
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_GTM_ID=GTM-XXXXXXX # Optional
```

**Pricing**: Free

**Estimated Time**: 15 minutes

---

## 9. Cloudflare Setup (DNS & Wildcard Subdomain)

**Purpose**: DNS management, wildcard subdomain for agent sites

### Steps

1. **Create Cloudflare Account**
   - Go to [https://www.cloudflare.com/sign-up](https://www.cloudflare.com/sign-up)
   - Sign up with email

2. **Add Your Domain**
   - Click "Add site"
   - Enter your domain: `nestassociates.com`
   - Plan: Free
   - Click "Add site"

3. **Update Nameservers**
   - Cloudflare will show you 2 nameservers
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Update nameservers to Cloudflare's nameservers
   - Wait for DNS propagation (5 minutes to 48 hours, usually <1 hour)

4. **Configure DNS Records for Vercel**
   - DNS → Records → Add record

   **For Dashboard**:
   - Type: `CNAME`
   - Name: `dashboard` (or `@` for root domain)
   - Target: `cname.vercel-dns.com`
   - Proxy status: Proxied (orange cloud)

   **For Agent Sites (Wildcard)**:
   - Type: `CNAME`
   - Name: `*.agents`
   - Target: `cname.vercel-dns.com`
   - Proxy status: Proxied (orange cloud)

   This allows:
   - Dashboard: `dashboard.nestassociates.com`
   - Agent sites: `john-smith.agents.nestassociates.com`, `jane-doe.agents.nestassociates.com`, etc.

5. **Configure SSL/TLS**
   - SSL/TLS → Overview
   - Mode: **Full (strict)**
   - Universal SSL: Enabled (automatically generated)
   - Cloudflare will handle SSL certificates for wildcard subdomain

6. **Configure Page Rules** (optional)
   - Page Rules → Create Page Rule
   - URL: `*.agents.nestassociates.com/*`
   - Settings:
     - Cache Level: Standard
     - Browser Cache TTL: 4 hours
   - This improves performance for agent sites

### What You'll Configure in Vercel

When you add domain in Vercel:
- Go to project → Settings → Domains
- Add domain: `dashboard.nestassociates.com`
- Add domain: `*.agents.nestassociates.com` (for agent sites)
- Vercel will verify DNS automatically

**Pricing**: Free (Cloudflare Free plan is sufficient)

**Estimated Time**: 30 minutes (+ DNS propagation wait)

---

## 10. Apex27 Dual API Setup (Portal + Standard) ✅ RECOMMENDED

**Purpose**: Pull from BOTH Portal API and Standard API for 100% complete property data

### ✅ Dual API Strategy for Complete Data Coverage

**Why Both APIs?**
- **Portal API** (You have now): 97 fields, reliable, images confirmed working
- **Standard API** (Request access): ~150 fields, structured flag objects, rentFrequency
- **Merged**: 100% complete data with no gaps!

**See complete implementation**: [APEX27_DUAL_API_IMPLEMENTATION.md](./APEX27_DUAL_API_IMPLEMENTATION.md)

### Steps

1. **Portal API - You Already Have This**

   **Find Your Credentials**:
   - Check Apex27 CRM → Settings → API / Integrations
   - Portal URL format: `https://portals-XXXXX.apex27.co.uk`
   - API Key: 32-character hex string

   **Test Portal API**:
   ```bash
   # IMPORTANT: Portal API uses form-urlencoded (NOT JSON!)
   curl -X POST "https://portals-YOUR-ID.apex27.co.uk/api/get-portal-options" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "api_key=YOUR_API_KEY"
   ```

   **Confirmed working with**:
   - Portal: `https://portals-5ab21b55.apex27.co.uk`
   - Returns: branches, listings with 97 fields
   - Images: 35+ per property
   - Format: form-urlencoded POST requests

2. **Standard API - Request Access Now**

   **Email Template**:
   ```
   Subject: Request for Standard API Access (To Complement Portal API)

   Hi [Account Manager],

   We have Portal API access (https://portals-xxxxx.apex27.co.uk) and it's working well.

   Request: Standard API access IN ADDITION to our Portal API

   Why we need both:
   We're pulling from BOTH APIs to get complete property data:
   - Portal API: Core data, images (proven reliable)
   - Standard API: Flag objects (rentalFlags, residentialFlags), rentFrequency field

   We'll merge data from both sources for 100% data coverage.

   Usage: 1-2 calls to each API every 15 minutes (~6k calls/month total)

   Please provide:
   1. Standard API key for https://api.apex27.co.uk
   2. Confirm dual API usage is permitted

   Thank you!
   ```

   **Send to**: Your Apex27 account manager or support@apex27.co.uk

3. **Test Standard API** (When you receive credentials)

   ```bash
   # Standard API uses X-Api-Key header (different from Portal!)
   curl -X GET "https://api.apex27.co.uk/branches" \
     -H "X-Api-Key: YOUR_STANDARD_API_KEY" \
     -H "Accept: application/json"

   curl -X GET "https://api.apex27.co.uk/listings?branchId=1962&pageSize=5&includeImages=1" \
     -H "X-Api-Key: YOUR_STANDARD_API_KEY"
   ```

4. **Get Branch IDs**
   - Portal API: Call `/api/get-portal-options` → returns branches
   - Standard API: Call `/branches` → returns same branch IDs
   - Assign branch IDs to agents: John Smith → Branch 1962

5. **Generate Cron Secret**
   ```bash
   openssl rand -hex 32
   ```

### What You'll Copy to .env.local

```bash
# Apex27 Portal API (Start with this - you have it now)
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
APEX27_PORTAL_API_KEY=your-portal-api-key

# Apex27 Standard API (Add when you receive credentials)
APEX27_STANDARD_URL=https://api.apex27.co.uk
APEX27_STANDARD_API_KEY=your-standard-api-key

# Cron Security
CRON_SECRET=your-generated-32-char-secret
```

### How Dual API Sync Works

**Phase 1: Portal API Only** (This week - while waiting for Standard API)
1. Cron runs every 15 minutes
2. Fetches from Portal API only
3. Gets core data (97 fields)
4. Syncs properties to database

**Phase 2: Dual API** (Next week - when Standard API arrives)
1. Cron runs every 15 minutes
2. **Fetches from BOTH APIs in parallel** (2 calls total)
3. **Merges data**: Portal core + Standard flags
4. **100% complete properties** in database
5. Enhanced filtering and categorization

**API Calls**: 2-4 calls every 15 minutes = ~192-384 calls/day (0.13% of Standard API limit)

---

## 11. Complete Environment Configuration

### Update .env.local Files

**apps/dashboard/.env.local**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Apex27 Dual API (Portal + Standard for complete data)
APEX27_PORTAL_URL=https://portals-xxxxx.apex27.co.uk
APEX27_PORTAL_API_KEY=your-portal-api-key

APEX27_STANDARD_URL=https://api.apex27.co.uk
APEX27_STANDARD_API_KEY=your-standard-api-key

# Cron Security
CRON_SECRET=your-generated-32-char-secret

# OS Data Hub API
OS_DATA_HUB_API_KEY=your-os-datahub-key

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...

# Vercel (for build system)
VERCEL_API_TOKEN=your-vercel-token
VERCEL_TEAM_ID=team_xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@nestassociates.com

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your-auth-token

# Environment
NODE_ENV=development
```

**apps/agent-site/.env.local**:

```bash
# Public API URL (points to dashboard API)
PUBLIC_API_URL=http://localhost:3000/api

# Google Analytics
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Tag Manager
PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## 12. Verify Setup

### Run Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase (or skip if using cloud)
cd supabase
supabase start

# 3. Push migrations (if not done already)
supabase db push

# 4. Return to root and start dashboard
cd ..
npm run dev:dashboard

# 5. Open http://localhost:3000
```

### Test Checklist

- [ ] Dashboard loads at http://localhost:3000
- [ ] Login page appears at http://localhost:3000/login
- [ ] Can log in with admin credentials
- [ ] Database connection works (check Supabase dashboard for active connections)
- [ ] Environment variables loaded correctly (check for console errors)

---

## 13. Production Deployment Checklist

Before deploying to production:

### Security

- [ ] Change all default passwords
- [ ] Enable 2FA on Supabase, Vercel, GitHub accounts
- [ ] Review Supabase RLS policies are enabled on all tables
- [ ] Verify service role key is NOT exposed in client-side code
- [ ] Configure rate limiting on Vercel
- [ ] Add CORS restrictions to public API endpoints

### DNS & Domains

- [ ] Configure Cloudflare DNS for production domains
- [ ] Verify SSL certificates active on all domains
- [ ] Test wildcard subdomain works: `test-agent.agents.nestassociates.com`

### Monitoring

- [ ] Verify Sentry is receiving events
- [ ] Configure Vercel Analytics
- [ ] Set up alert rules in Sentry
- [ ] Set up uptime monitoring (optional: UptimeRobot, Pingdom)

### Email

- [ ] Verify Resend domain
- [ ] Test all email templates send correctly
- [ ] Configure SPF, DKIM, DMARC records
- [ ] Check emails not going to spam

### Performance

- [ ] Run Lighthouse audit on deployed sites
- [ ] Verify Vercel Edge Network is active
- [ ] Test page load times from different locations
- [ ] Configure CDN caching headers

---

## Cost Summary

### Monthly Recurring Costs

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **GitHub** | Free or Team | $0 - $4/user | Team plan recommended for advanced features |
| **Supabase** | Pro | $25/month | Includes 8GB database, 100GB bandwidth, daily backups |
| **Vercel** | Pro | $20/month | Required for custom domains, team features |
| **Resend** | Free → Pro | $0 - $20/month | Start free, upgrade at 3k emails/month |
| **Mapbox** | Pay-as-you-go | ~$0 | Free tier (50k loads) sufficient for admin use |
| **OS Data Hub** | Free | $0 | Free tier (600 req/min) more than enough |
| **Sentry** | Free → Team | $0 - $26/month | Optional, start with free tier |
| **Google Analytics** | Free | $0 | Optional |
| **Cloudflare** | Free | $0 | Free plan sufficient |
| **Total** | | **$45-95/month** | Depends on usage and optional services |

### Estimated Costs by Phase

**Development Phase** (Month 1-3):
- Minimum: $45/month (Supabase Pro + Vercel Pro, all free tiers)
- Recommended: $70/month (add Resend Pro for testing emails)

**Production Phase** (Month 4+):
- Minimum: $65/month (add Resend Pro)
- Recommended: $95/month (add Sentry Team for monitoring)

**Scaling Phase** (100+ agents):
- Supabase may need upgrade to Team ($599/month) or Enterprise
- Vercel may need additional bandwidth (~$20/100GB)
- Resend may need higher tier (~$50-80/month for volume)

---

## 14. Environment Variable Checklist

Use this checklist to ensure all variables are set:

### Dashboard (.env.local)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Settings → API
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Settings → API (⚠️ Secret!)
- [ ] `APEX27_PORTAL_URL` - Your portal URL (e.g., `https://portals-xxxxx.apex27.co.uk`)
- [ ] `APEX27_PORTAL_API_KEY` - Your Portal API key (32-character hex string)
- [ ] `APEX27_STANDARD_URL` - Set to `https://api.apex27.co.uk`
- [ ] `APEX27_STANDARD_API_KEY` - Request from Apex27 support (can add later)
- [ ] `CRON_SECRET` - Generated random 32-char string (for securing cron endpoints)
- [ ] `OS_DATA_HUB_API_KEY` - From OS Data Hub project
- [ ] `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - From Mapbox account
- [ ] `VERCEL_API_TOKEN` - From Vercel account tokens
- [ ] `VERCEL_TEAM_ID` - From Vercel team settings
- [ ] `RESEND_API_KEY` - From Resend API keys
- [ ] `RESEND_FROM_EMAIL` - Your verified email address
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - From Sentry project (optional)
- [ ] `NODE_ENV` - Set to `development` locally, `production` on Vercel

### Agent Site (.env.local)

- [ ] `PUBLIC_API_URL` - Dashboard URL (local: http://localhost:3000/api)
- [ ] `PUBLIC_GA_MEASUREMENT_ID` - From Google Analytics (optional)
- [ ] `PUBLIC_GTM_ID` - From Google Tag Manager (optional)

---

## 15. Vercel Production Configuration

### Dashboard Deployment

1. **Configure Build Settings**
   - Framework: Next.js
   - Root Directory: `apps/dashboard`
   - Build Command: `cd ../.. && npx turbo run build --filter=@nest/dashboard`
   - Output Directory: `apps/dashboard/.next`
   - Install Command: `npm install`

2. **Configure Environment Variables**
   - Add all production environment variables in Vercel dashboard
   - Environment: Production, Preview, Development (select all)

3. **Configure Domains**
   - Add domain: `dashboard.nestassociates.com` (or your production URL)
   - Follow Vercel's DNS instructions (already done in Cloudflare step)

### Agent Site Deployment (Template Project)

1. **Import Agent Site as Separate Project**
   - In Vercel, click "Add New..." → "Project"
   - Import same GitHub repository
   - Framework: Astro
   - Root Directory: `apps/agent-site`
   - Build Command: `cd ../.. && npx turbo run build --filter=@nest/agent-site`
   - Output Directory: `apps/agent-site/dist`

2. **Configure for Wildcard Subdomain**
   - Add domain: `*.agents.nestassociates.com`
   - Vercel will handle SSL automatically

**Note**: The agent sites will be deployed programmatically via Vercel API from the build system (Phase 7 implementation).

---

## 16. GitHub Repository Secrets (for CI/CD)

When you implement CI/CD pipelines in Phase 13, you'll need to add these secrets:

1. **Go to Repository → Settings → Secrets and variables → Actions**

2. **Add Repository Secrets**:
   - `SUPABASE_ACCESS_TOKEN` - From Supabase Dashboard → Account → Access Tokens
   - `VERCEL_TOKEN` - Same as VERCEL_API_TOKEN from step 3
   - `VERCEL_ORG_ID` - Same as VERCEL_TEAM_ID
   - `VERCEL_PROJECT_ID` - From Vercel project settings

**These will be used in** `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`

---

## Quick Reference Card

**Save this for easy access**:

```
📋 QUICK REFERENCE

Supabase:
  URL: https://xxxxx.supabase.co
  Dashboard: https://app.supabase.com/project/xxxxx

Vercel:
  Dashboard URL: https://xxxxx.vercel.app
  Production URL: https://dashboard.nestassociates.com

GitHub:
  Repo: https://github.com/YOUR_ORG/multi-agent-platform

Mapbox:
  Dashboard: https://account.mapbox.com

Resend:
  Dashboard: https://resend.com/emails

Sentry:
  Dashboard: https://sentry.io/organizations/YOUR_ORG

Admin Login:
  Email: admin@nestassociates.com
  Password: (your secure password)
```

---

## Next Steps After Cloud Setup

Once all services are configured:

1. ✅ **Verify Environment Variables**
   ```bash
   # Test dashboard with cloud services
   npm run dev:dashboard
   # Try logging in with admin credentials
   ```

2. ✅ **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "feat: complete foundation setup"
   git push origin main
   # Vercel will auto-deploy
   ```

3. ✅ **Test Production Deployment**
   - Visit your Vercel dashboard URL
   - Try logging in
   - Check Sentry for any errors
   - Check database connections in Supabase

4. ✅ **Continue Implementation**
   - You're now ready to implement user stories (Phases 3+)
   - Start with Phase 3: User Story 1 (Agent Creation)
   - Follow the tasks in `specs/001-multi-agent-platform/tasks.md`

---

## Troubleshooting

### Supabase Connection Issues

**Problem**: "Failed to connect to database"
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused (Pro plan doesn't pause)

### Vercel Deployment Fails

**Problem**: Build fails with "Module not found"
- **Solution**: Verify `turbo.json` is in repository root
- Check build command includes `--filter=@nest/dashboard`
- Ensure all dependencies are in `package.json`

### Wildcard Subdomain Not Working

**Problem**: `agent.agents.nestassociates.com` shows "Not Found"
- **Solution**: Verify Cloudflare DNS has `*.agents` CNAME record
- Check Vercel has `*.agents.nestassociates.com` domain added
- Wait for DNS propagation (can take up to 48 hours)
- Test with `dig agent.agents.nestassociates.com` to verify DNS

### Emails Not Sending

**Problem**: Resend API returns error
- **Solution**: Verify API key is correct
- Check `RESEND_FROM_EMAIL` matches verified domain
- For testing, use `onboarding@resend.dev` as sender

### Mapbox Map Not Loading

**Problem**: Blank map or "Unauthorized" error
- **Solution**: Verify `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` starts with `pk.`
- Check token URL restrictions don't block localhost
- Verify browser console for specific error messages

---

## Support & Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Cloudflare Docs**: [https://developers.cloudflare.com](https://developers.cloudflare.com)
- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Mapbox Docs**: [https://docs.mapbox.com](https://docs.mapbox.com)
- **OS Data Hub Docs**: [https://osdatahub.os.uk/docs](https://osdatahub.os.uk/docs)

---

## Checklist Summary

Use this checklist to track your setup progress:

- [ ] 1. GitHub repository created and code pushed
- [ ] 2. Supabase project created (Pro plan, UK region)
- [ ] 3. Supabase API credentials obtained
- [ ] 4. PostGIS extension enabled
- [ ] 5. Database migrations applied (19 files)
- [ ] 6. Storage buckets created (avatars, content-images, property-images, documents)
- [ ] 7. Admin user created in Supabase
- [ ] 8. Vercel account created and dashboard project imported
- [ ] 9. Vercel environment variables configured
- [ ] 10. Vercel API token and team ID obtained
- [ ] 11. Resend account created and API key obtained
- [ ] 12. Resend domain verified (or using test domain)
- [ ] 13. Mapbox account created and access token obtained
- [ ] 14. OS Data Hub account created and API key obtained
- [ ] 15. Sentry account created and DSN obtained (optional)
- [ ] 16. Google Analytics property created (optional)
- [ ] 17. Cloudflare account created and domain added
- [ ] 18. Cloudflare DNS configured (dashboard + wildcard)
- [ ] 19. Both .env.local files populated with all credentials
- [ ] 20. Local development server runs successfully
- [ ] 21. Can log in with admin credentials
- [ ] 22. Production deployment to Vercel successful

---

**Completion Time**: 2-3 hours total

**You're ready to build!** Once this checklist is complete, return to development and I can help you implement user stories (Phases 3+).
