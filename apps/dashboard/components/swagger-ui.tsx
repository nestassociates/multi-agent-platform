'use client';

/**
 * Swagger UI Component
 * T027: Create dynamic Swagger UI component
 *
 * Renders interactive API documentation using swagger-ui-react
 */

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-muted-foreground">
        Loading API documentation...
      </div>
    </div>
  ),
});

interface SwaggerUIWrapperProps {
  url?: string;
}

export function SwaggerUIWrapper({ url = '/api/openapi.json' }: SwaggerUIWrapperProps) {
  return (
    <div className="swagger-ui-wrapper">
      <style jsx global>{`
        /* Custom Swagger UI styling to match dashboard theme */
        .swagger-ui {
          font-family: inherit;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .info .title {
          font-size: 2rem;
          font-weight: 700;
        }

        .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          padding: 20px 0;
        }

        .swagger-ui .opblock-tag {
          font-size: 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
        }

        .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #61affe;
          background: rgba(97, 175, 254, 0.05);
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #49cc90;
          background: rgba(73, 204, 144, 0.05);
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #fca130;
          background: rgba(252, 161, 48, 0.05);
        }

        .swagger-ui .opblock.opblock-patch {
          border-color: #50e3c2;
          background: rgba(80, 227, 194, 0.05);
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #f93e3e;
          background: rgba(249, 62, 62, 0.05);
        }

        .swagger-ui .opblock.opblock-options {
          border-color: #0d5aa7;
          background: rgba(13, 90, 167, 0.05);
        }

        .swagger-ui .btn {
          border-radius: 6px;
        }

        .swagger-ui .btn.execute {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }

        .swagger-ui .btn.execute:hover {
          background-color: hsl(var(--primary) / 0.9);
        }

        .swagger-ui select {
          border-radius: 6px;
        }

        .swagger-ui input[type="text"],
        .swagger-ui textarea {
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
        }

        .swagger-ui .model-box {
          background: hsl(var(--muted));
          border-radius: 6px;
        }

        .swagger-ui .response-col_status {
          font-weight: 600;
        }

        /* Dark mode support */
        .dark .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }

        .dark .swagger-ui .opblock-body pre {
          filter: invert(100%) hue-rotate(180deg);
        }

        .dark .swagger-ui img {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>
      <SwaggerUI url={url} />
    </div>
  );
}
