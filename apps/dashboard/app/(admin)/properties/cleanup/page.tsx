'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, CheckCircle, Loader2 } from 'lucide-react';

export default function PropertyCleanupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDryRun = async () => {
    setIsLoading(true);
    setError(null);
    setDryRunResult(null);

    try {
      const response = await fetch('/api/admin/properties/cleanup-non-exportable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Dry-run failed');
      }

      setDryRunResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async () => {
    if (!confirm('⚠️ WARNING: This will PERMANENTLY DELETE non-exportable properties!\n\nAre you absolutely sure you want to proceed?')) {
      return;
    }

    if (!confirm('This action cannot be undone. Have you backed up the database?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/properties/cleanup-non-exportable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Cleanup failed');
      }

      setCleanupResult(data);
      setDryRunResult(null); // Clear dry-run after actual cleanup
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Property Database Cleanup</h1>
      <p className="text-muted-foreground mb-6">
        Remove non-exportable properties (valuations, pending listings) from the database
      </p>

      {/* Warning Alert */}
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Critical Operation</strong>: This will permanently delete properties marked as non-exportable in Apex27.
          Always run in dry-run mode first!
        </AlertDescription>
      </Alert>

      {/* Dry Run Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Dry Run (Preview)</CardTitle>
          <CardDescription>
            See what would be deleted without actually deleting anything
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runDryRun}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Run Dry Run
              </>
            )}
          </Button>

          {dryRunResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Dry Run Results:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Would Delete:</strong> {dryRunResult.would_delete?.toLocaleString()} properties</p>
                <p><strong>Would Keep:</strong> {dryRunResult.would_keep?.toLocaleString()} properties</p>
              </div>

              {dryRunResult.sample_deletions && dryRunResult.sample_deletions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-1">Sample Properties to Delete:</p>
                  <div className="space-y-1">
                    {dryRunResult.sample_deletions.slice(0, 5).map((prop: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • ID: {prop.apex27_id} (Exportable: {prop.exportable === null ? 'Not in Apex27' : prop.exportable})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actual Cleanup Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Execute Cleanup</CardTitle>
          <CardDescription>
            Permanently delete non-exportable properties from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Before running cleanup:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Run dry-run mode first (above)</li>
                  <li>Backup the database</li>
                  <li>Review the deletion list carefully</li>
                  <li>Verify no marketed properties in the list</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={runCleanup}
              disabled={isLoading || !dryRunResult}
              variant="destructive"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Execute Cleanup (Permanent!)
                </>
              )}
            </Button>

            {cleanupResult && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Cleanup Complete!
                </h3>
                <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <p><strong>Deleted:</strong> {cleanupResult.deleted_count?.toLocaleString()} properties</p>
                  <p><strong>Remaining:</strong> {cleanupResult.remaining_count?.toLocaleString()} properties</p>
                  <p><strong>Duration:</strong> {(cleanupResult.duration_ms / 1000).toFixed(2)}s</p>
                  <p className="text-xs mt-2">{cleanupResult.timestamp}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
