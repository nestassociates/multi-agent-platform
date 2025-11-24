const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase/migrations/20251122000002_import_postcodes.sql');
const content = fs.readFileSync(migrationPath, 'utf8');

// Split into lines and skip the first 3 header lines
const lines = content.split('\n');
const insertStatements = lines.slice(3).filter(line => line.trim().startsWith('INSERT'));

console.log(`Total INSERT statements found: ${insertStatements.length}`);

// Create batches of 15 statements each
const batchSize = 15;
const batches = [];

for (let i = 0; i < insertStatements.length; i += batchSize) {
  const batch = insertStatements.slice(i, i + batchSize);
  // Modify each INSERT to add ON CONFLICT clause
  const modifiedBatch = batch.map(stmt => {
    // Remove the semicolon at the end if present
    const trimmed = stmt.trim().replace(/;$/, '');
    return `${trimmed} ON CONFLICT (code) DO NOTHING;`;
  });
  batches.push(modifiedBatch.join('\n'));
}

// Write batches to separate files for processing
const batchDir = path.join(__dirname, 'postcode_batches');
if (!fs.existsSync(batchDir)) {
  fs.mkdirSync(batchDir);
}

batches.forEach((batch, index) => {
  const batchFile = path.join(batchDir, `batch_${String(index + 1).padStart(4, '0')}.sql`);
  fs.writeFileSync(batchFile, batch);
});

console.log(`Created ${batches.length} batch files in ${batchDir}`);
console.log(`Each batch contains up to ${batchSize} INSERT statements`);
