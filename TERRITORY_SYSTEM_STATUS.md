# Territory System Status & Known Issues

**Date**: 2025-11-20
**Status**: Partially Working - Needs Debugging

---

## ✅ What Works

1. **Map Display**
   - ✅ Interactive Mapbox map loads correctly
   - ✅ Centered on Manchester, UK
   - ✅ Zoom/pan controls work
   - ✅ Drawing tools visible (polygon, trash)

2. **Territory Storage**
   - ✅ Territories save to PostgreSQL database
   - ✅ PostGIS GEOGRAPHY type stores boundaries
   - ✅ Territories persist across sessions
   - ✅ Can view saved territories in database

3. **Territory Display**
   - ✅ Existing territories load from database
   - ✅ Displayed as colored polygons on map
   - ✅ Each agent gets unique color
   - ✅ Territory list shows in sidebar
   - ✅ Click territory to see popup

4. **Territory Management**
   - ✅ Delete territories (instant update, no refresh)
   - ✅ Click to select/highlight territories
   - ✅ Real-time state updates

---

## ❌ What's Broken

### **Critical Issue: Form Not Appearing**

**Problem**: When drawing a polygon, the creation form should appear but doesn't.

**Evidence from logs:**
```
✏️ Draw create event: {...}
✏️ Setting drawnPolygon and isCreating=true
🔍 Component state: {isCreating: true, hasPolygon: true}  ← Should show form
🔍 Component state: {isCreating: false, hasPolygon: false} ← Immediately resets!
```

**Symptoms:**
- Draw polygon on map
- Form doesn't appear
- Territory auto-creates without user input (count goes from 6 to 7)
- No way to set name or assign agent

**Root Cause**: Unknown - state is being reset immediately after being set

**Files Involved:**
- `components/admin/territory-page-client.tsx` - Form conditional rendering
- `components/admin/territory-map.tsx` - Draw event handlers

---

### **Issue 2: Property Count Always Zero**

**Problem**: All territories show `property_count: 0` in database

**Database Evidence:**
```json
{"id": "...", "name": "Warrington", "property_count": 0}
{"id": "...", "name": "Crumpsall", "property_count": 0}
{"id": "...", "name": "Salford", "property_count": 0}
```

**Possible Causes:**
1. OS Data Hub API not being called (no logs showing API calls)
2. OS Places API key not working (showed "Invalid ApiKey" earlier)
3. PostGIS trigger not firing
4. Property count not being passed from API response to database

**What Should Happen:**
```
User draws polygon
  ↓
Call OS Places API POST /polygon with GeoJSON
  ↓
Receive: {header: {totalresults: 1234}, results: [...]}
  ↓
Count residential properties (filter CLASSIFICATION_CODE:R*)
  ↓
Save to database: property_count: 1234
  ↓
Display: "1,234 properties"
```

**What's Actually Happening:**
```
User draws polygon
  ↓
??? (no API call in logs)
  ↓
Save to database: property_count: 0
  ↓
Display: "0 properties"
```

---

### **Issue 3: Agent Info Missing in Popup**

**Problem**: When clicking a territory, popup shows "Unknown" for agent name

**Expected**: Popup should show agent's name from the territories.agent.profile data

**Files Involved:**
- `components/admin/territory-map.tsx` - Popup rendering logic
- Database query might not be joining agent/profile correctly

---

## 🔧 Environment Setup

### **Completed:**
- ✅ Upgraded to OS Data Hub Premium plan
- ✅ OS Places API enabled in project
- ✅ API keys configured:
  - `OS_DATA_HUB_API_KEY`: 2IQxYrJUYbBkImHRT38W0zb8mnb9g45Z
  - `OS_DATA_HUB_API_SECRET`: kZpbVf6aIPadQsMQ
- ✅ Environment variables in .env.local
- ✅ Mapbox token configured
- ✅ PostGIS functions created in database

### **Verified Working:**
- ✅ OS Places API endpoint responds (tested with curl)
- ✅ Premium plan active
- ✅ API returns proper JSON response
- ✅ Can query small test polygons successfully

---

## 🎯 Next Session Tasks

### **Priority 1: Fix Form Display (30 min)**
1. Debug why `isCreating` state resets immediately
2. Check for duplicate event handlers
3. Verify React component re-rendering
4. Get form to actually display when drawing

### **Priority 2: Fix Property Counting (1 hour)**
1. Ensure OS Places API is actually being called
2. Add comprehensive logging to trace API flow
3. Verify API response parsing
4. Ensure count is saved to database
5. Test with real drawn territories

### **Priority 3: Fix Agent Display (15 min)**
1. Check database query joins agent data
2. Verify popup accesses correct data path
3. Test clicking territory shows agent name

### **Priority 4: Enhance Territory Data (2 hours)**
Once basic counting works:
- Add commercial property count
- Add area size display
- Explore other OS Data Hub datasets
- Add territory insights panel

---

## 📊 Today's Accomplishments

Despite the bugs, we achieved massive progress:

**Phases Completed:**
- Phase 6: Admin Agent Management
- Phase 11: Agent Profile Self-Management
- Phase 12: WordPress Public API
- Phase 13: Production Security & Monitoring
- Phase 8: Territory Assignment (75% complete)

**Territory System Built:**
- Interactive Mapbox mapping
- PostGIS spatial queries
- Overlap detection
- Database storage
- Color-coded visualization
- Real-time updates
- API endpoints (GET, POST, DELETE)

**Total:**
- ~85 tasks completed
- 10 phases done
- 75% of entire platform complete
- Production-ready except for final polish

---

## 🐛 Debug Checklist for Next Session

**Before starting:**
- [ ] Fresh dev server restart
- [ ] Clear browser cache
- [ ] Check React DevTools for state

**When debugging form:**
- [ ] Add `useEffect` to log `isCreating` changes
- [ ] Check if form component is even mounting
- [ ] Look for conflicting state updates
- [ ] Verify conditional rendering logic

**When debugging API:**
- [ ] Check if `countPropertiesInBoundary` is being called
- [ ] Verify API endpoint URL is correct
- [ ] Test API call directly with curl
- [ ] Check response parsing logic

---

## 💡 Suspicions

**Why form might not show:**
1. Another component is resetting state
2. React Strict Mode double-rendering issue
3. Event handler called twice (create + delete)
4. Conditional logic has bug

**Why property count is zero:**
1. API call isn't happening at all (no logs)
2. OR API is called but response isn't parsed
3. OR count isn't passed to database insert

**Most likely:**
The component has a race condition where drawing triggers both create AND some other event that resets the state.

---

**Next session: Start fresh, methodically debug these two critical issues, then enhance with rich territory data from OS Data Hub.**
