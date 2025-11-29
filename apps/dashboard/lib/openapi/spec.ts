/**
 * OpenAPI Spec Generator
 * T025: Create OpenAPI spec generator
 *
 * Generates OpenAPI 3.0 specification from Zod schemas and route definitions
 */

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

// Import routes (this registers all routes with the registry)
import { registry } from './routes';

/**
 * Generate the complete OpenAPI specification
 */
export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Nest Associates API',
      version: '1.0.0',
      description: `
API documentation for the Nest Associates multi-agent real estate platform.

## Authentication

Most endpoints require authentication via JWT bearer token obtained from the login endpoint.

## Rate Limiting

- **Login**: 5 attempts per email per 15 minutes
- **Contact Form**: 5 submissions per IP per hour

Rate limit headers are returned on all rate-limited endpoints:
- \`X-RateLimit-Remaining\`: Number of requests remaining
- \`X-RateLimit-Reset\`: Unix timestamp when limit resets

## Roles

- **Admin**: Full access to all endpoints
- **Agent**: Access to own profile, content, and properties
- **Public**: Access to public agent/property listings and contact form

## Webhooks

The Apex27 webhook endpoint validates HMAC-SHA256 signatures for security.
      `.trim(),
      contact: {
        name: 'Nest Associates Support',
        email: 'support@nestassociates.co.uk',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Current environment',
      },
      {
        url: 'https://dashboard.nestassociates.co.uk',
        description: 'Production',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Login, logout, and password management' },
      { name: 'Admin - Agents', description: 'Admin agent management endpoints' },
      { name: 'Admin - Content', description: 'Admin content moderation endpoints' },
      { name: 'Admin - Global Content', description: 'Admin global content management' },
      { name: 'Admin - Territories', description: 'Admin territory and postcode management' },
      { name: 'Agent', description: 'Agent self-service endpoints' },
      { name: 'Public', description: 'Public API endpoints (no auth required)' },
      { name: 'Webhooks', description: 'External service webhook endpoints' },
    ],
    externalDocs: {
      description: 'Nest Associates Developer Documentation',
      url: 'https://docs.nestassociates.co.uk',
    },
  });
}

/**
 * Get the OpenAPI spec as JSON string
 */
export function getOpenAPISpecJSON(): string {
  return JSON.stringify(generateOpenAPISpec(), null, 2);
}
