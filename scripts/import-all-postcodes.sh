#!/bin/bash
# Import all postcodes by applying the migration SQL file via Supabase CLI

cd "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"

echo "🚀 Starting import of 2,728 postcodes..."
echo "This will take several minutes..."
echo ""

# Since we don't have psql or Supabase CLI linked, we'll need to use the dashboard
# to apply the migration, OR use a language that can connect to Supabase

# For now, let's create smaller migration files
echo "📦 Creating smaller migration files..."

tail -n +4 supabase/migrations/20251122000002_import_postcodes.sql | \
  sed 's/);$/) ON CONFLICT (code) DO NOTHING;/' | \
  split -l 500 - /tmp/postcode_migration_

COUNTER=0
for file in /tmp/postcode_migration_*; do
  COUNTER=$((COUNTER + 1))
  LINES=$(wc -l < "$file")
  echo "Created migration file $COUNTER with $LINES postcodes: $file"
done

echo ""
echo "✅ Split into $COUNTER files in /tmp/"
echo ""
echo "To apply these migrations, you can:"
echo "1. Use the Supabase dashboard SQL editor"
echo "2. Use a script with Supabase client libraries"
echo "3. Use psql directly if available"
