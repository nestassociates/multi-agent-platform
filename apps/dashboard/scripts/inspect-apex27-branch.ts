/**
 * Inspect Apex27 Branch Data
 *
 * Fetches and displays all available data for specific branch IDs
 *
 * Run: npx tsx apps/dashboard/scripts/inspect-apex27-branch.ts
 */

import { getListings } from '../lib/apex27/client';

async function main() {
  const targetBranches = ['1963', '1210']; // Torbay and Auckland

  console.log('🔍 Fetching properties from Apex27...\n');

  const { listings } = await getListings({ page: 1, pageSize: 100 });

  for (const branchId of targetBranches) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Branch ${branchId} Details:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const listing = listings.find(l => String(l.branch.id) === branchId);

    if (!listing) {
      console.log(`❌ No properties found for branch ${branchId}`);
      continue;
    }

    const branch = listing.branch;

    console.log('🏢 BRANCH DATA:');
    console.log('  ID:', branch.id);
    console.log('  Name:', branch.name);
    console.log('  Code:', branch.code);
    console.log('  Email:', branch.email);
    console.log('  Phone:', branch.phone);
    console.log('  Address:', branch.address1);
    console.log('  City:', branch.city);
    console.log('  Postal Code:', branch.postalCode);

    // Check if listing has negotiator/user data
    if (listing.negotiators && listing.negotiators.length > 0) {
      console.log('\n👤 NEGOTIATORS (Agents):');
      listing.negotiators.forEach((neg: any, idx: number) => {
        console.log(`\n  Negotiator ${idx + 1}:`);
        console.log('    ID:', neg.id);
        console.log('    Email:', neg.email);
        console.log('    First Name:', neg.firstName);
        console.log('    Last Name:', neg.lastName);
        console.log('    Title:', neg.title);
        console.log('    Is Active:', neg.isActive);
      });
    } else {
      console.log('\n👤 NEGOTIATORS: None found in listing data');
    }

    // Show raw listing object structure (first level keys)
    console.log('\n📦 Available Listing Fields:');
    Object.keys(listing).forEach(key => {
      const value = (listing as any)[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(`  - ${key}: ${type}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
