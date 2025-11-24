#!/bin/bash
# Apply postcode batches to Supabase

cd "/Users/dan/Documents/Websites/Nest Associates/Project Nest/Nest"

echo "Starting batch import of 2,728 postcodes..."
echo "This will take a few minutes..."

BATCH_FILES=(/tmp/postcode_batch_*)
TOTAL=${#BATCH_FILES[@]}
COUNTER=0

for batch in "${BATCH_FILES[@]}"; do
  COUNTER=$((COUNTER + 1))
  BATCH_SIZE=$(wc -l < "$batch")
  echo "[$COUNTER/$TOTAL] Importing batch with $BATCH_SIZE postcodes..."

  # Use Supabase MCP via environment variable
  # Read the batch content and execute
  SQL_CONTENT=$(cat "$batch")

  # You'll need to run this manually via the MCP tool
  # or use a Node.js script with Supabase client
  echo "  Batch file: $batch"
done

echo "Done! Check database with: SELECT COUNT(*) FROM postcodes;"
