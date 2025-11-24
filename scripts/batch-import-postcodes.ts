/**
 * Batch Import UK Postcodes to Supabase
 *
 * Applies the postcode migration in batches to avoid timeout
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20251122000002_import_postcodes.sql');
const BATCH_SIZE = 50; // Smaller batches for reliability

async function main() {
  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📖 Reading migration file...');
  const content = fs.readFileSync(MIGRATION_FILE, 'utf-8');

  // Extract only INSERT statements
  const lines = content.split('\n').filter(line => line.trim().startsWith('INSERT'));

  console.log(`📊 Found ${lines.length} INSERT statements`);
  console.log(`🔄 Applying in batches of ${BATCH_SIZE}...\n`);

  const totalBatches = Math.ceil(lines.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = lines.slice(i, i + BATCH_SIZE);

    // Add ON CONFLICT to handle duplicates
    const batchSQL = batch
      .map(line => line.replace(');', ') ON CONFLICT (code) DO NOTHING;'))
      .join('\n');

    process.stdout.write(`[${batchNum}/${totalBatches}] Batch ${i + 1}-${Math.min(i + BATCH_SIZE, lines.length)}... `);

    try {
      const { error } = await supabase.rpc('exec', { sql: batchSQL });

      if (error) {
        throw error;
      }

      successCount += batch.length;
      console.log(`✅ (${successCount} total)`);
    } catch (error: any) {
      // Fallback: apply one by one if batch fails
      console.log(`⚠️  Batch failed, retrying individually...`);

      for (const line of batch) {
        const singleSQL = line.replace(');', ') ON CONFLICT (code) DO NOTHING;');
        try {
          await supabase.rpc('exec', { sql: singleSQL });
          successCount++;
        } catch (e: any) {
          console.error(`    ❌ Failed:`, line.substring(0, 80) + '...');
          errorCount++;
        }
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  // Verify final count
  const { count, error } = await supabase
    .from('postcodes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting count:', error);
  } else {
    console.log(`\n📊 Total postcodes in database: ${count}`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
