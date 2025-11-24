# UK Postcodes Import Instructions

## Summary
This guide explains how to import 2,728 UK postcode records into the Supabase database.

## Files Created
- `supabase/migrations/20251122000002_import_postcodes.sql` - Original migration file (2,728 INSERT statements)
- `postcode_batches/` - Directory with 182 batch files (15 records each)

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file in smaller chunks:

```sql
-- Copy and paste the contents of each batch file from postcode_batches/
-- Start with batch_0001.sql, then batch_0002.sql, etc.
```

## Option 2: Via Direct SQL Execution

Run this Node.js script to import all batches systematically:

```bash
node <<'EOF'
const fs = require('fs');
const path = require('path');

const batchDir = './postcode_batches';
const batchFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`-- Importing ${batchFiles.length} batches with ${batchFiles.length * 15} total postcodes`);
console.log('-- Copy this entire output and paste into Supabase SQL Editor\\n');

batchFiles.forEach((file, idx) => {
  const content = fs.readFileSync(path.join(batchDir, file), 'utf8');
  console.log(`-- Batch ${idx + 1}/${batchFiles.length}: ${file}`);
  console.log(content);
  console.log('');
});

console.log('-- Import complete! Verify with: SELECT COUNT(*) FROM postcodes;');
EOF
```

## Option 3: Manual Import Summary

Total postcodes to import: **2,728**
Batch size: **15 postcodes per batch**
Total batches: **182**

Current database count: **2** (from initial test)

## Verification

After import, verify the count:

```sql
SELECT COUNT(*) FROM postcodes;
-- Expected result: 2728 (or slightly more if duplicates existed)

SELECT code, area_km2 FROM postcodes ORDER BY code LIMIT 10;
-- Should show AB10, AB11, AB12, etc.
```

## Notes

- All INSERT statements include `ON CONFLICT (code) DO NOTHING` to handle duplicates
- Each postcode includes: code, boundary (PostGIS geography), center_point, and area_km2
- Source data: UK Postcode Districts from OS Open Data (GitHub: uk-postcode-polygons)
