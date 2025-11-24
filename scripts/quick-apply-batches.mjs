#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../apps/dashboard/.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Get all batch files
const files = fs.readdirSync('/tmp').filter(f => f.startsWith('batch_Part_')).sort();

console.log(`Found ${files.length} batch files to import`);
let success = 0, failed = 0;

for (let i = 0; i < files.length; i++) {
  const sql = fs.readFileSync(`/tmp/${files[i]}`, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    success += sql.split('\n').filter(l => l.includes('INSERT')).length;
    if ((i + 1) % 20 === 0) console.log(`Progress: ${i + 1}/${files.length} batches (${success} postcodes)`);
  } catch (e) {
    failed++;
  }
}

const { count } = await supabase.from('postcodes').select('*', { count: 'exact', head: true });
console.log(`\nDone! Success: ${success}, Failed: ${failed}, Total in DB: ${count}`);
