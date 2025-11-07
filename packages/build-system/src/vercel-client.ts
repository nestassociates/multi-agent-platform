/**
 * Vercel API Client
 * Handles deployment triggers and status checking via Vercel API
 */

export interface VercelDeploymentResponse {
  id: string;
  url: string;
  name: string;
  readyState: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  createdAt: number;
}

export interface DeploymentStatus {
  id: string;
  state: 'QUEUED' | 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'READY' | 'CANCELED';
  url: string | null;
  errorMessage: string | null;
}

/**
 * Get Vercel API configuration from environment
 */
function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    throw new Error('VERCEL_API_TOKEN environment variable is required');
  }

  if (!teamId) {
    throw new Error('VERCEL_TEAM_ID environment variable is required');
  }

  return { token, teamId };
}

/**
 * Trigger a deployment via Vercel API
 * @param agentSubdomain - Agent's subdomain for deployment
 * @param dataJson - JSON data to inject into build
 * @returns Deployment ID and URL
 */
export async function triggerDeployment(
  agentSubdomain: string,
  dataJson: string
): Promise<{ deploymentId: string; deploymentUrl: string }> {
  const { token, teamId } = getVercelConfig();

  try {
    // For now, this is a placeholder that would use Vercel's deployments API
    // In production, this would:
    // 1. Create a deployment via POST /v13/deployments
    // 2. Pass the agent data as environment variable or build context
    // 3. Return the deployment ID and URL

    console.log(`[Vercel] Triggering deployment for ${agentSubdomain}`);

    // This is a simplified implementation
    // Real implementation would use Vercel API endpoints
    const deploymentId = `dpl_${Date.now()}_${agentSubdomain}`;
    const deploymentUrl = `https://${agentSubdomain}.agents.nestassociates.com`;

    return {
      deploymentId,
      deploymentUrl,
    };
  } catch (error) {
    console.error('[Vercel] Deployment trigger failed:', error);
    throw error;
  }
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
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
    }

    const deployment = (await response.json()) as VercelDeploymentResponse;

    return {
      id: deployment.id,
      state: deployment.readyState,
      url: deployment.readyState === 'READY' ? deployment.url : null,
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
    const status = await checkDeploymentStatus(deploymentId);

    if (status.state === 'READY' || status.state === 'ERROR' || status.state === 'CANCELED') {
      return status;
    }

    // Wait 5 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
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
