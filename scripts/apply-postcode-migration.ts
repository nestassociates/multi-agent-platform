/**
 * Apply Postcode Migration in Batches
 *
 * Reads the postcode migration SQL file and applies it in batches to avoid timeout issues.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20251122000002_import_postcodes.sql');
const BATCH_SIZE = 100; // Number of INSERT statements per batch

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📖 Reading migration file...');
  const content = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().startsWith('INSERT'));

  console.log(`📊 Found ${lines.length} INSERT statements`);
  console.log(`🔄 Will apply in batches of ${BATCH_SIZE}`);

  const totalBatches = Math.ceil(lines.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = lines.slice(i, i + BATCH_SIZE);
    const batchSQL = batch.join('\n');

    console.log(`[${batchNum}/${totalBatches}] Applying batch (${batch.length} postcodes)...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: batchSQL });

      if (error) {
        // Try execute directly if exec_sql doesn't exist
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: batchSQL }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }

      successCount += batch.length;
      console.log(`  ✅ Success (${successCount}/${lines.length} total)`);
    } catch (error: any) {
      console.error(`  ❌ Error in batch ${batchNum}:`, error.message);
      errorCount += batch.length;
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  // Verify count
  const { count } = await supabase.from('postcodes').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Total postcodes in database: ${count}`);
}

main().catch(console.error);
