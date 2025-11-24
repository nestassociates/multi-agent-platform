const fs = require('fs');
const path = require('path');

const batchDir = path.join(__dirname, 'postcode_batches');
const batchFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Total batches to process: ${batchFiles.length}`);

// Process each batch
batchFiles.forEach((file, index) => {
  const filePath = path.join(batchDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Output batch number and SQL
  console.log(`BATCH_${index + 1}|${content}`);
});
