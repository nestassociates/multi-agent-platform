/**
 * Apex27 Branch Check Script
 *
 * Queries Apex27 API to see what branches exist and compares with database
 *
 * Run: npx tsx apps/dashboard/scripts/check-apex27-branches.ts
 */

import { getListings } from '../lib/apex27/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('🔍 Checking Apex27 branches...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch properties from Apex27 (first 100)
    console.log('📡 Fetching properties from Apex27 API...');
    const { listings, pageCount } = await getListings({ page: 1, pageSize: 100 });

    console.log(`Found ${listings.length} properties (page 1 of ${pageCount})`);

    // Extract unique branches from Apex27
    const apex27Branches = new Map<string, { id: string; name: string; propertyCount: number }>();

    listings.forEach(listing => {
      if (listing.branch?.id) {
        const branchId = String(listing.branch.id);
        if (apex27Branches.has(branchId)) {
          apex27Branches.get(branchId)!.propertyCount++;
        } else {
          apex27Branches.set(branchId, {
            id: branchId,
            name: listing.branch.name || 'Unknown',
            propertyCount: 1,
          });
        }
      }
    });

    console.log(`\n📊 Found ${apex27Branches.size} unique branches in Apex27:\n`);

    // Get agents from database
    const { data: dbAgents } = await supabase
      .from('agents')
      .select('apex27_branch_id, subdomain, status')
      .not('apex27_branch_id', 'is', null);

    const dbBranchIds = new Set(dbAgents?.map(a => a.apex27_branch_id) || []);

    // Compare and report
    console.log('Branch ID | Branch Name          | Properties | In Database | Status');
    console.log('----------|----------------------|------------|-------------|--------');

    for (const [branchId, branch] of apex27Branches.entries()) {
      const inDb = dbBranchIds.has(branchId);
      const agent = dbAgents?.find(a => a.apex27_branch_id === branchId);

      console.log(
        `${branchId.padEnd(9)} | ${branch.name.padEnd(20).substring(0, 20)} | ${String(branch.propertyCount).padStart(10)} | ${inDb ? '✅ Yes' : '❌ No'} | ${agent?.status || 'N/A'}`
      );
    }

    // Check for branch 1963 specifically
    console.log('\n🔍 Checking for Leanne Taylor (Branch 1963):');
    if (apex27Branches.has('1963')) {
      const branch = apex27Branches.get('1963')!;
      console.log(`✅ Branch 1963 EXISTS in Apex27`);
      console.log(`   Name: ${branch.name}`);
      console.log(`   Properties: ${branch.propertyCount}`);

      if (!dbBranchIds.has('1963')) {
        console.log(`   ⚠️  NO AGENT in database for this branch!`);
        console.log(`   → Properties need to be synced to trigger auto-creation`);
      }
    } else {
      console.log(`❌ Branch 1963 NOT FOUND in Apex27 (in first 100 properties)`);
      console.log(`   → May be on a different page, or no properties exist`);
    }

    // Summary
    console.log('\n📈 Summary:');
    console.log(`Apex27 Branches: ${apex27Branches.size}`);
    console.log(`Database Agents: ${dbAgents?.length || 0}`);
    console.log(`Missing Agents: ${Array.from(apex27Branches.keys()).filter(id => !dbBranchIds.has(id)).length}`);

    const missingBranches = Array.from(apex27Branches.keys()).filter(id => !dbBranchIds.has(id));
    if (missingBranches.length > 0) {
      console.log(`\n⚠️  Branches in Apex27 but NOT in database:`);
      missingBranches.forEach(branchId => {
        const branch = apex27Branches.get(branchId)!;
        console.log(`   - ${branchId}: ${branch.name} (${branch.propertyCount} properties)`);
      });
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('APEX27_API_KEY')) {
      console.log('\n💡 Make sure APEX27_API_KEY is set in your .env.local file');
    }
    process.exit(1);
  }
}

main();
