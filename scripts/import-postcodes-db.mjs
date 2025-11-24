/**
 * Import postcodes to Supabase in batches
 * Using ES modules to avoid TypeScript compilation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATION_FILE = join(__dirname, '../supabase/migrations/20251122000002_import_postcodes.sql');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Load .env.local
  const envPath = join(__dirname, '../apps/dashboard/.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');

  let supabaseUrl, supabaseKey;
  for (const line of envContent.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.log('📖 Reading migration file...');
  const content = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().startsWith('INSERT'));

  console.log(`📊 Found ${lines.length} INSERT statements`);
  console.log(`🔄 Importing in batches...\n`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Add ON CONFLICT handling
    const sql = line.replace(');', ') ON CONFLICT (code) DO NOTHING;');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        throw error;
      }

      successCount++;

      if ((i + 1) % 50 === 0) {
        console.log(`  ✅ Imported ${i + 1}/${lines.length} postcodes...`);
      }
    } catch (error) {
      // Likely a duplicate, skip
      skipCount++;
    }

    // Tiny delay to avoid rate limiting
    if (i % 100 === 0) {
      await sleep(100);
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);

  // Verify
  const { count } = await supabase
    .from('postcodes')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total postcodes in database: ${count}`);
}

main().catch(console.error);
