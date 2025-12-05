/**
 * Vercel API Client
 * Handles deployment triggers and status checking via Vercel API
 * 
 * Deployment Strategy:
 * - Uses Vercel's file-based deployment API
 * - Each agent site is deployed as a separate project or alias
 * - Site data is injected as a JSON file during deployment
 */

export interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  createdAt: number;
  alias?: string[];
}

export interface DeploymentStatus {
  id: string;
  state: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  url: string | null;
  errorMessage: string | null;
}

export interface VercelConfig {
  token: string;
  teamId: string;
  projectId: string;
  baseDomain: string;
}

/**
 * Get Vercel API configuration from environment
 */
export function getVercelConfig(): VercelConfig {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_AGENT_SITE_PROJECT_ID;
  const baseDomain = process.env.AGENT_SITE_BASE_DOMAIN || 'nestassociates.co.uk';

  if (!token) {
    throw new Error('VERCEL_API_TOKEN environment variable is required');
  }

  if (!teamId) {
    throw new Error('VERCEL_TEAM_ID environment variable is required');
  }

  if (!projectId) {
    throw new Error('VERCEL_AGENT_SITE_PROJECT_ID environment variable is required');
  }

  return { token, teamId, projectId, baseDomain };
}

/**
 * Generate the Astro site files with agent data baked in
 * Returns base64-encoded file contents for Vercel deployment
 */
function generateDeploymentFiles(dataJson: string): Array<{ file: string; data: string }> {
  // The site-data.json file that Astro loads at build time
  const siteDataFile = {
    file: 'src/data/site-data.json',
    data: Buffer.from(dataJson).toString('base64'),
  };

  return [siteDataFile];
}

/**
 * Trigger a deployment via Vercel API
 * Creates a new deployment with the agent's data file
 * 
 * @param agentSubdomain - Agent's subdomain for deployment
 * @param dataJson - JSON data to inject into build
 * @returns Deployment ID and URL
 */
export async function triggerDeployment(
  agentSubdomain: string,
  dataJson: string
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  const config = getVercelConfig();

  try {
    console.log(`[Vercel] Triggering deployment for ${agentSubdomain}`);

    // For Git-based deployments, we use the deploy hook approach
    // This triggers a rebuild of the project with environment variables
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    
    if (deployHookUrl) {
      // Trigger via deploy hook (simpler approach)
      return await triggerViaDeployHook(agentSubdomain, dataJson, config);
    }

    // Alternative: Direct API deployment with files
    return await triggerViaFilesAPI(agentSubdomain, dataJson, config);
  } catch (error) {
    console.error('[Vercel] Deployment trigger failed:', error);
    throw error;
  }
}

/**
 * Trigger deployment via Vercel Deploy Hook
 * This is the simplest approach - triggers a Git-based rebuild
 */
async function triggerViaDeployHook(
  agentSubdomain: string,
  dataJson: string,
  config: VercelConfig
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL!;

  // Store the agent data in a temporary location or use environment variable
  // The build process will fetch this data
  const response = await fetch(deployHookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Custom metadata passed to the build
      meta: {
        agentSubdomain,
        buildType: 'agent-site',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deploy hook failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  
  return {
    deploymentId: result.job?.id || `hook_${Date.now()}`,
    deploymentUrl: `https://${agentSubdomain}.${config.baseDomain}`,
  };
}

/**
 * Trigger deployment via Vercel Files API
 * Creates a deployment with inline file content
 */
async function triggerViaFilesAPI(
  agentSubdomain: string,
  dataJson: string,
  config: VercelConfig
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  const { token, teamId, projectId, baseDomain } = config;

  // Create deployment with the data file
  const response = await fetch(
    `https://api.vercel.com/v13/deployments?teamId=${teamId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `agent-site-${agentSubdomain}`,
        project: projectId,
        target: 'production',
        // Set the subdomain as an alias
        alias: [`${agentSubdomain}.${baseDomain}`],
        // Build environment variables
        env: {
          AGENT_SUBDOMAIN: agentSubdomain,
          // The data is passed as an environment variable for the build
          AGENT_SITE_DATA: dataJson,
        },
        // Git source - deploy from main branch
        gitSource: {
          type: 'github',
          ref: 'main',
          repoId: process.env.VERCEL_AGENT_SITE_REPO_ID,
        },
        // Build settings
        projectSettings: {
          framework: 'astro',
          buildCommand: 'pnpm build',
          outputDirectory: 'dist',
          installCommand: 'pnpm install',
        },
        meta: {
          agentSubdomain,
          buildType: 'agent-site',
          triggeredAt: new Date().toISOString(),
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Vercel API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  const deployment = (await response.json()) as VercelDeploymentResponse;

  console.log(`[Vercel] Deployment created: ${deployment.id}`);

  return {
    deploymentId: deployment.id,
    deploymentUrl: `https://${agentSubdomain}.${baseDomain}`,
  };
}

/**
 * Check deployment status
 * @param deploymentId - Vercel deployment ID
 * @returns Deployment status
 */
export async function checkDeploymentStatus(
  deploymentId: string
): Promise<DeploymentStatus> {
  const { token, teamId } = getVercelConfig();

  try {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${teamId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // If 404, deployment might still be initializing
      if (response.status === 404) {
        return {
          id: deploymentId,
          state: 'QUEUED',
          url: null,
          errorMessage: null,
        };
      }
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
    }

    const deployment = (await response.json()) as VercelDeploymentResponse;

    return {
      id: deployment.id,
      state: deployment.readyState,
      url: deployment.readyState === 'READY' ? `https://${deployment.url}` : null,
      errorMessage: deployment.readyState === 'ERROR' ? 'Build failed' : null,
    };
  } catch (error) {
    console.error('[Vercel] Status check failed:', error);
    throw error;
  }
}

/**
 * Poll deployment until complete or failed
 * @param deploymentId - Vercel deployment ID
 * @param maxAttempts - Maximum polling attempts (default: 60 = 5 minutes at 5s intervals)
 * @returns Final deployment status
 */
export async function waitForDeployment(
  deploymentId: string,
  maxAttempts: number = 60
): Promise<DeploymentStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await checkDeploymentStatus(deploymentId);

      console.log(`[Vercel] Deployment ${deploymentId} status: ${status.state} (attempt ${attempts + 1}/${maxAttempts})`);

      if (status.state === 'READY' || status.state === 'ERROR' || status.state === 'CANCELED') {
        return status;
      }

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error(`[Vercel] Error checking status (attempt ${attempts + 1}):`, error);
      // Continue polling on transient errors
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }
  }

  // Timeout
  return {
    id: deploymentId,
    state: 'ERROR',
    url: null,
    errorMessage: 'Deployment timeout after 5 minutes',
  };
}

/**
 * Cancel a deployment
 * @param deploymentId - Vercel deployment ID
 */
export async function cancelDeployment(deploymentId: string): Promise<boolean> {
  const { token, teamId } = getVercelConfig();

  try {
    const response = await fetch(
      `https://api.vercel.com/v12/deployments/${deploymentId}/cancel?teamId=${teamId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Vercel] Cancel deployment failed:', error);
    return false;
  }
}

/**
 * Set up a custom domain alias for an agent's deployment
 * @param deploymentId - Vercel deployment ID
 * @param subdomain - Agent's subdomain
 */
export async function setDeploymentAlias(
  deploymentId: string,
  subdomain: string
): Promise<boolean> {
  const { token, teamId, baseDomain } = getVercelConfig();
  const alias = `${subdomain}.${baseDomain}`;

  try {
    const response = await fetch(
      `https://api.vercel.com/v2/deployments/${deploymentId}/aliases?teamId=${teamId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alias }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(`[Vercel] Failed to set alias ${alias}:`, error);
      return false;
    }

    console.log(`[Vercel] Alias set: ${alias}`);
    return true;
  } catch (error) {
    console.error('[Vercel] Set alias failed:', error);
    return false;
  }
}

/**
 * Delete a deployment (used when agent is deactivated)
 * @param subdomain - Agent's subdomain to remove
 */
export async function removeAgentDeployment(subdomain: string): Promise<boolean> {
  const { token, teamId, baseDomain } = getVercelConfig();
  const alias = `${subdomain}.${baseDomain}`;

  try {
    // Remove the alias
    const response = await fetch(
      `https://api.vercel.com/v2/aliases/${encodeURIComponent(alias)}?teamId=${teamId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      console.log(`[Vercel] Removed alias: ${alias}`);
      return true;
    }

    // 404 means it doesn't exist, which is fine
    if (response.status === 404) {
      console.log(`[Vercel] Alias ${alias} not found, already removed`);
      return true;
    }

    const error = await response.json();
    console.error(`[Vercel] Failed to remove alias ${alias}:`, error);
    return false;
  } catch (error) {
    console.error('[Vercel] Remove deployment failed:', error);
    return false;
  }
}
