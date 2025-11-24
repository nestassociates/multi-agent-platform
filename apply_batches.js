const fs = require('fs');
const path = require('path');

const batchDir = path.join(__dirname, 'postcode_batches');
const batchFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${batchFiles.length} batch files to process`);
console.log('');

// Output the batches for processing
batchFiles.forEach((file, index) => {
  const filePath = path.join(batchDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`===== BATCH ${index + 1}/${batchFiles.length} (${file}) =====`);
  console.log(content);
  console.log('');
});
