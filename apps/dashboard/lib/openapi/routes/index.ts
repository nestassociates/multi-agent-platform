/**
 * OpenAPI Routes Index
 * T024: Create route index combining all route definitions
 *
 * Import all route files to register them with the OpenAPI registry
 */

// Import all route definition files
// Each file registers its routes with the shared registry
import './auth';
import './admin-agents';
import './admin-content';
import './admin-global';
import './admin-territories';
import './agent';
import './public';
import './webhooks';

// Re-export registry for convenience
export { registry } from '../registry';
