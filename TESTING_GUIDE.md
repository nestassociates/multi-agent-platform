# Testing Guide - Multi-Agent Real Estate Platform

**Purpose**: Systematically test all implemented features (Phases 1-5)
**Date**: 2025-11-07

---

## Pre-Testing Checklist

### 1. Environment Setup ✓
- [x] `.env.local` file exists
- [x] Supabase credentials configured
- [ ] Database migrations applied
- [ ] Test admin user created
- [ ] Dependencies installed

### 2. Services Status
Check if these services are configured:
- [ ] Supabase (database + auth + storage)
- [ ] Apex27 API credentials (Portal or Standard)
- [ ] Resend (email service)
- [ ] Mapbox (for territories - optional for testing)
- [ ] Vercel (for deployments - optional for testing)

---

## Testing Sequence

### Level 1: Local Development Server

#### Test 1.1: Start Development Server
```bash
cd /Users/dan/Documents/Websites/Nest\ Associates/Project\ Nest/Nest
pnpm install
pnpm run dev:dashboard
```

**Expected**:
- Server starts on http://localhost:3000
- No TypeScript errors
- No build errors

**Actual**: ___________

---

#### Test 1.2: Database Connection
```bash
# Visit http://localhost:3000/api/health (if health endpoint exists)
# OR check server logs for Supabase connection
```

**Expected**:
- Supabase client initializes successfully
- No connection errors in logs

**Actual**: ___________

---

### Level 2: Authentication System (Phase 2)

#### Test 2.1: Login Page
**URL**: http://localhost:3000/login

**Steps**:
1. Navigate to login page
2. Check page renders without errors
3. Verify form fields present (email, password)

**Expected**:
- Login page loads
- Form is visible
- No console errors

**Actual**: ___________

---

#### Test 2.2: Admin Login
**Test User**: `website@nestassociates.co.uk` (from specs)

**Steps**:
1. Enter admin credentials
2. Submit form
3. Check if redirected to dashboard

**Expected**:
- Successful login
- Redirect to dashboard home
- Session established

**Actual**: ___________

**Note**: If admin user doesn't exist, create via Supabase dashboard first.

---

### Level 3: Agent Creation (Phase 3 - US1)

#### Test 3.1: Navigate to Agent Creation
**URL**: http://localhost:3000/agents/new (admin only)

**Steps**:
1. Log in as admin
2. Navigate to Agents → Create New Agent
3. Verify form loads

**Expected**:
- Form displays all fields:
  - Email
  - Temporary password
  - First name, Last name
  - Phone
  - Subdomain
  - Apex27 branch ID
  - Bio
  - Qualifications
  - Social media links

**Actual**: ___________

---

#### Test 3.2: Create Test Agent
**Test Data**:
```json
{
  "email": "test.agent@nest.test",
  "password": "TempPassword123!",
  "first_name": "Test",
  "last_name": "Agent",
  "phone": "07700 900000",
  "subdomain": "test-agent-001",
  "apex27_branch_id": "1962",
  "bio": "Test agent for validation",
  "qualifications": ["ARLA", "NAEA"]
}
```

**Steps**:
1. Fill out form with test data
2. Submit
3. Check for success message
4. Verify agent appears in database

**Expected**:
- Form submits successfully
- Success notification appears
- Agent record created in `agents` table
- User record created in `auth.users`
- Welcome email sent (check logs if Resend not configured)

**Actual**: ___________

---

#### Test 3.3: Agent First Login
**Credentials**: test.agent@nest.test / TempPassword123!

**Steps**:
1. Log out as admin
2. Log in with agent credentials
3. Should be forced to change password
4. Change password
5. Access agent dashboard

**Expected**:
- Forced password change page appears
- Password change succeeds
- Agent dashboard loads
- Agent sees their profile page

**Actual**: ___________

---

#### Test 3.4: Agent Profile Update
**URL**: http://localhost:3000/profile (agent view)

**Steps**:
1. Navigate to profile page
2. Update bio text
3. Add/remove qualifications
4. Save changes
5. Reload page and verify changes persisted

**Expected**:
- Profile form loads with existing data
- Changes save successfully
- Data persists across page reloads
- Build queue entry created (check `build_queue` table)

**Actual**: ___________

---

### Level 4: Property Synchronization (Phase 4 - US2)

#### Test 4.1: Database Schema Check
```sql
-- Run in Supabase SQL editor
SELECT * FROM properties LIMIT 1;
SELECT * FROM agents WHERE apex27_branch_id = '1962';
```

**Expected**:
- `properties` table exists
- `agents` table has branch_id field
- PostGIS `location` column present

**Actual**: ___________

---

#### Test 4.2: Webhook Endpoint
**URL**: http://localhost:3000/api/webhooks/apex27

**Test with curl**:
```bash
curl -X POST http://localhost:3000/api/webhooks/apex27 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "listing": {
      "id": 999888,
      "branch": { "id": 1962, "name": "Test Branch", "code": "TB01", "address1": "Test", "address2": null, "city": "London", "county": "London", "postalCode": "EC1A 1BB", "country": "UK", "phone": "020 7123 4567", "fax": null, "email": "test@test.com", "hasSales": true, "hasLettings": false, "hasNewHomes": false, "hasLand": false, "hasAuctions": false, "hasParkHomes": false, "hasCommercialSales": false, "hasCommercialLettings": false, "dtsUpdated": "2024-01-01T00:00:00Z", "updateMd5Hash": "hash" },
      "user": { "id": 1, "email": "agent@test.com", "title": "Mr", "firstName": "Test", "lastName": "Agent", "isActive": true, "isCallRecordingsEnabled": false, "isCallTranscriptionsEnabled": false, "dtsUpdated": "2024-01-01T00:00:00Z", "updateMd5Hash": "hash" },
      "archived": false,
      "reference": "TEST999888",
      "fullReference": "TB01-TEST999888",
      "address1": "123 Test Street",
      "address2": null,
      "address3": null,
      "address4": null,
      "city": "London",
      "county": "Greater London",
      "postalCode": "SW1A 1AA",
      "country": "United Kingdom",
      "displayAddress": "123 Test Street, London SW1A 1AA",
      "locationType": "residential",
      "summary": "Test property",
      "printSummary": null,
      "incomeDescription": null,
      "description": "A beautiful test property",
      "customDescription1": null,
      "customDescription2": null,
      "customDescription3": null,
      "customDescription4": null,
      "customDescription5": null,
      "customDescription6": null,
      "bullets": ["Modern kitchen", "Large garden"],
      "priceCurrency": "GBP",
      "price": "450000",
      "pricePrefix": null,
      "tenure": "Freehold",
      "rentFrequency": null,
      "minimumTermMonths": null,
      "transactionType": "sale",
      "status": "Available",
      "websiteStatus": "Available",
      "mainSearchRegionId": 1,
      "saleProgression": null,
      "propertyType": "terraced",
      "displayPropertyType": "Terraced House",
      "propertySubType": null,
      "tenancyType": null,
      "bedrooms": 3,
      "bathrooms": 2,
      "receptions": 2,
      "ensuites": 1,
      "toilets": 3,
      "kitchens": 1,
      "diningRooms": 1,
      "garages": 0,
      "parkingSpaces": 2,
      "yearBuilt": 2010,
      "condition": "excellent",
      "ageCategory": "modern",
      "furnished": "unfurnished",
      "commercialUseClasses": [],
      "accessibilityFeatures": [],
      "heatingFeatures": ["Gas central heating"],
      "parkingFeatures": ["Driveway"],
      "outsideSpaceFeatures": ["Garden"],
      "waterSupplyFeatures": [],
      "electricitySupplyFeatures": [],
      "sewerageSupplyFeatures": [],
      "broadbandSupplyFeatures": [],
      "floodSources": [],
      "customFeatures": [],
      "internalArea": 1200,
      "internalAreaUnit": "sqft",
      "externalArea": 500,
      "externalAreaUnit": "sqft",
      "floors": 2,
      "entranceFloor": 0,
      "floorNumber": null,
      "levelsOccupied": 2,
      "latitude": 51.5074,
      "longitude": -0.1278,
      "uprn": null,
      "grossYield": null,
      "totalIncomeText": null,
      "featured": false,
      "unlisted": false,
      "rentService": null,
      "saleFee": 0,
      "saleFeeType": 0,
      "saleFeePayableBy": 0,
      "saleFeeNotes": null,
      "councilTaxAmount": 1500,
      "councilTaxBand": "D",
      "domesticRatesAmount": null,
      "serviceChargeAmount": null,
      "serviceChargeDescription": null,
      "groundRentAmount": null,
      "groundRentDescription": null,
      "groundRentReviewPeriod": null,
      "groundRentPercentageIncrease": null,
      "insuranceDescription": null,
      "termsOfBusiness": null,
      "dateLeaseStart": null,
      "leaseYearsRemaining": null,
      "leaseDuration": null,
      "dateOfInstruction": "2024-01-01T00:00:00Z",
      "dateAvailableFrom": null,
      "feeType": null,
      "lettingFees": null,
      "epcExempt": false,
      "epcEeCurrent": 75,
      "epcEePotential": 85,
      "epcEiCurrent": 70,
      "epcEiPotential": 80,
      "epcArCurrent": null,
      "dtsEpcExpiry": "2030-01-01T00:00:00Z",
      "epcReference": "EPC123456",
      "epcNotes": null,
      "showPrice": true,
      "exportable": true,
      "matchable": true,
      "dtsCreated": "2024-01-01T00:00:00Z",
      "dtsUpdated": "2024-01-01T00:00:00Z",
      "dtsWithdrawn": null,
      "dtsArchived": null,
      "dtsGoLive": "2024-01-01T00:00:00Z",
      "dtsMarketed": "2024-01-01T00:00:00Z",
      "dtsRemarketed": null,
      "updateMd5Hash": "hash123",
      "flags": { "hasElectricity": true, "hasFibreOptic": true, "hasGas": true, "hasSatelliteCableTv": false, "hasTelephone": true, "hasWater": true, "isAuction": false, "isArticle4Area": false, "isListed": false, "hasRestrictions": false, "hasRequiredAccess": false, "hasRightsOfWay": false, "hasFloodedInLastFiveYears": false, "hasFloodDefenses": false },
      "residentialFlags": { "hasAccessibilityFeatures": false, "hasBasement": false, "hasConservatory": false, "hasDoubleGlazing": true, "hasFireplace": false, "hasGym": false, "hasLoft": false, "hasOutbuildings": false, "hasPorterSecurity": false, "hasSwimmingPool": false, "hasTennisCourt": false, "hasUtilityRoom": false, "hasWaterfront": false, "hasWoodFloors": false, "isSharedAccommodation": false },
      "saleFlags": { "isChainFree": true, "isNewHome": false, "isRepossession": false, "isRetirement": false, "hasEquityLoanIncentive": false, "hasHelpToBuyIncentive": false, "hasMiNewHomeIncentive": false, "hasNewBuyIncentive": false, "hasPartBuyPartRentIncentive": false, "hasSharedEquityIncentive": false, "hasSharedOwnershipIncentive": false, "developmentOpportunity": false, "investmentOpportunity": false },
      "rentalFlags": { "petsAllowed": null, "smokersConsidered": null, "sharersConsidered": null, "hasBurglarAlarm": null, "hasWashingMachine": null, "hasDishwasher": null, "allBillsIncluded": null, "waterBillIncluded": null, "gasBillIncluded": null, "electricityBillIncluded": null, "oilBillIncluded": null, "councilTaxIncluded": null, "councilTaxExempt": null, "tvLicenceIncluded": null, "satelliteCableTvBillIncluded": null, "internetBillIncluded": null, "telephoneBillIncluded": null, "isTenanted": null, "isServiced": null, "isStudentProperty": null },
      "commercialFlags": { "businessForSale": null },
      "sale": null,
      "upsellNames": [],
      "matchingSearchRegions": [],
      "metadata": []
    }
  }'
```

**Expected**:
- HTTP 200 response
- `{"success": true}` in response
- Property created in database
- Property linked to correct agent (branch_id 1962)

**Actual**: ___________

---

#### Test 4.3: Agent Properties Page
**URL**: http://localhost:3000/my-properties (agent view)

**Steps**:
1. Log in as test agent
2. Navigate to "My Properties"
3. Verify test property appears

**Expected**:
- Properties list loads
- Test property (123 Test Street) visible
- Property details accurate

**Actual**: ___________

---

### Level 5: Content Creation (Phase 5 - US3)

#### Test 5.1: Navigate to Content Creation
**URL**: http://localhost:3000/content/new (agent view)

**Steps**:
1. Log in as agent
2. Navigate to Content → Create New
3. Verify rich text editor loads

**Expected**:
- Content form displays
- Tiptap editor loads with toolbar
- Content type selector present

**Actual**: ___________

---

#### Test 5.2: Create Draft Blog Post
**Test Data**:
- **Type**: Blog Post
- **Title**: "Top 5 Tips for First-Time Buyers in London"
- **Slug**: Auto-generated
- **Content**: "Write some test content..."
- **Excerpt**: "A helpful guide for first-time buyers"

**Steps**:
1. Fill out form
2. Save as draft (don't submit for review yet)
3. Verify draft saved

**Expected**:
- Auto-save triggers every 30 seconds
- Draft saved successfully
- Content appears in "My Content" → "Drafts" tab

**Actual**: ___________

---

#### Test 5.3: Submit Content for Review
**Steps**:
1. Open saved draft
2. Click "Submit for Review"
3. Verify status changes

**Expected**:
- Status changes to "Pending Review"
- Content no longer editable
- Appears in admin moderation queue

**Actual**: ___________

---

#### Test 5.4: Admin Content Moderation
**URL**: http://localhost:3000/content-moderation (admin view)

**Steps**:
1. Log in as admin
2. Navigate to Content Moderation
3. Verify pending content appears
4. Preview content
5. Approve content

**Expected**:
- Moderation queue shows pending content
- Preview pane works
- Approve button creates build queue entry
- Agent receives approval email (check logs)

**Actual**: ___________

---

#### Test 5.5: Reject Content with Feedback
**Steps**:
1. Create another draft as agent
2. Submit for review
3. Log in as admin
4. Reject with reason: "Needs more detail about market conditions"
5. Check agent receives feedback

**Expected**:
- Rejection reason saved
- Status changes to "Rejected"
- Agent receives rejection email
- Agent can view feedback and edit

**Actual**: ___________

---

### Level 6: Build Queue (Integrated)

#### Test 6.1: Check Build Queue Table
```sql
-- Run in Supabase SQL editor
SELECT * FROM build_queue ORDER BY created_at DESC LIMIT 10;
```

**Expected**:
- Build entries exist from content approval
- Status is 'queued'
- Agent ID correct
- Priority set (P2 for content)

**Actual**: ___________

---

#### Test 6.2: Build Queue Deduplication
**Steps**:
1. Approve multiple content pieces rapidly
2. Check build queue
3. Verify only one build queued per agent within 5 min window

**Expected**:
- Duplicate builds prevented
- Only one pending build per agent
- Later approvals update trigger_reason

**Actual**: ___________

---

### Level 7: Automated Tests

#### Test 7.1: Run Integration Tests
```bash
cd /Users/dan/Documents/Websites/Nest\ Associates/Project\ Nest/Nest
pnpm test:integration
```

**Expected**:
- T099: Apex27 webhook test passes
- T100: Property create test passes
- T101: Property update test passes
- T102: Property delete test passes
- T103: Webhook contract test passes

**Actual**: ___________

---

#### Test 7.2: Run Contract Tests
```bash
pnpm test:contract
```

**Expected**:
- Agent creation contract tests pass
- Agent profile contract tests pass
- Content creation contract tests pass

**Actual**: ___________

---

#### Test 7.3: Run E2E Tests
```bash
pnpm test:e2e
```

**Expected**:
- Agent creation E2E passes
- Agent first login E2E passes
- Agent profile update E2E passes
- Content creation E2E passes
- Content approval E2E passes

**Actual**: ___________

---

## Common Issues & Fixes

### Issue: "Supabase connection failed"
**Fix**:
1. Check .env.local has correct Supabase URL and keys
2. Verify Supabase project is not paused
3. Check internet connection

### Issue: "Database migrations not applied"
**Fix**:
```bash
# Apply migrations via Supabase CLI or dashboard
supabase db push

# OR manually run SQL files in Supabase SQL editor
```

### Issue: "Admin user doesn't exist"
**Fix**:
1. Go to Supabase Dashboard → Authentication
2. Add user manually:
   - Email: website@nestassociates.co.uk
   - Password: (choose secure password)
3. Insert profile record:
```sql
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES (
  'auth-user-id-from-above',
  'website@nestassociates.co.uk',
  'Admin',
  'User',
  'super_admin'
);
```

### Issue: "Agent can't see properties"
**Fix**:
1. Verify agent's `apex27_branch_id` matches webhook branch ID
2. Check `properties` table has agent_id foreign key
3. Re-send webhook with correct branch_id

### Issue: "Content not appearing in moderation queue"
**Fix**:
1. Check content status is 'pending_review'
2. Verify RLS policies allow admin to read content_submissions
3. Check admin user has correct role

---

## Testing Checklist Summary

- [ ] Local dev server starts
- [ ] Database connects
- [ ] Admin can log in
- [ ] Admin can create agent
- [ ] Agent receives welcome email (or logged)
- [ ] Agent can log in and change password
- [ ] Agent can update profile
- [ ] Webhook endpoint accepts property data
- [ ] Property appears in agent's property list
- [ ] Agent can create draft content
- [ ] Auto-save works (check after 30 seconds)
- [ ] Agent can submit content for review
- [ ] Admin sees pending content in moderation queue
- [ ] Admin can approve content → build queued
- [ ] Admin can reject content → agent gets feedback
- [ ] Build queue prevents duplicates
- [ ] Integration tests pass
- [ ] Contract tests pass
- [ ] E2E tests pass

---

## Next Steps After Testing

If all tests pass:
1. ✅ **MVP Core is Working!**
2. Proceed to Phase 7 (Build System) for deployment
3. OR do cloud setup and deploy current state

If tests fail:
1. Document failures in this guide
2. Fix issues one by one
3. Re-test until all pass
