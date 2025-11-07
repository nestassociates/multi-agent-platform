/**
 * Build Orchestrator
 * Coordinates the entire build process for agent sites
 */

import { generateDataFile } from './data-generator';
import { triggerDeployment, waitForDeployment } from './vercel-client';
import { getNextBuild, startBuild, completeBuild } from './queue';

export interface BuildResult {
  success: boolean;
  deploymentId?: string;
  deploymentUrl?: string;
  errorMessage?: string;
  buildLogs?: string;
}

/**
 * Process a single build from the queue
 * @param buildId - Build queue record ID
 * @returns Build result
 */
export async function processBuild(buildId: string): Promise<BuildResult> {
  const logs: string[] = [];
  const log = (message: string) => {
    console.log(`[Build ${buildId}] ${message}`);
    logs.push(`${new Date().toISOString()} - ${message}`);
  };

  try {
    log('Starting build process');

    // Get build details from queue
    const build = await getNextBuild();
    if (!build || build.id !== buildId) {
      throw new Error('Build not found or already processed');
    }

    // Mark as in progress
    const started = await startBuild(buildId);
    if (!started) {
      throw new Error('Failed to mark build as started');
    }

    const agentId = build.agent_id;
    const subdomain = build.agent?.subdomain;

    if (!subdomain) {
      throw new Error('Agent subdomain not found');
    }

    log(`Processing build for agent: ${subdomain}`);

    // Step 1: Generate data file
    log('Generating site data...');
    const dataJson = await generateDataFile(agentId);

    if (!dataJson) {
      throw new Error('Failed to generate site data - agent may be inactive or deleted');
    }

    log(`Generated ${dataJson.length} bytes of site data`);

    // Step 2: Trigger Vercel deployment
    log('Triggering Vercel deployment...');
    const { deploymentId, deploymentUrl } = await triggerDeployment(
      subdomain,
      dataJson
    );

    log(`Deployment triggered: ${deploymentId}`);

    // Step 3: Wait for deployment to complete
    log('Waiting for deployment to complete...');
    const deploymentStatus = await waitForDeployment(deploymentId);

    if (deploymentStatus.state === 'READY') {
      log(`Deployment successful: ${deploymentStatus.url}`);

      // Mark build as completed
      await completeBuild(buildId, {
        success: true,
        build_url: deploymentStatus.url || deploymentUrl,
      });

      return {
        success: true,
        deploymentId,
        deploymentUrl: deploymentStatus.url || deploymentUrl,
        buildLogs: logs.join('\n'),
      };
    } else {
      throw new Error(
        deploymentStatus.errorMessage || `Deployment failed with state: ${deploymentStatus.state}`
      );
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    log(`Build failed: ${errorMessage}`);

    // Mark build as failed
    await completeBuild(buildId, {
      success: false,
      error_message: errorMessage,
    });

    return {
      success: false,
      errorMessage,
      buildLogs: logs.join('\n'),
    };
  }
}

/**
 * Process multiple builds in parallel
 * @param maxConcurrent - Maximum number of concurrent builds (default: 20)
 * @returns Array of build results
 */
export async function processBuildQueue(
  maxConcurrent: number = 20
): Promise<BuildResult[]> {
  const results: BuildResult[] = [];

  // Get pending builds (limited to maxConcurrent)
  const builds: any[] = [];

  for (let i = 0; i < maxConcurrent; i++) {
    const build = await getNextBuild();
    if (!build) break;
    builds.push(build);
  }

  if (builds.length === 0) {
    console.log('[Builder] No pending builds in queue');
    return [];
  }

  console.log(`[Builder] Processing ${builds.length} builds in parallel`);

  // Process all builds in parallel
  const buildPromises = builds.map((build) => processBuild(build.id));
  const buildResults = await Promise.allSettled(buildPromises);

  // Collect results
  buildResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      console.error(`[Builder] Build ${builds[index].id} crashed:`, result.reason);
      results.push({
        success: false,
        errorMessage: result.reason?.message || 'Build process crashed',
      });
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(
    `[Builder] Completed ${successCount} successful, ${failCount} failed builds`
  );

  return results;
}
