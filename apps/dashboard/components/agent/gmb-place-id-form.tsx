'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';

export function GMBPlaceIdForm({ currentPlaceId }: { currentPlaceId?: string | null }) {
  const router = useRouter();
  const [placeId, setPlaceId] = useState(currentPlaceId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/agent/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_place_id: placeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save Place ID');
      }

      router.refresh();
    } catch (error: any) {
      console.error('Error saving Place ID:', error);
      alert(error.message || 'Failed to save Place ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="google_place_id">Google Place ID</Label>
        <Input
          id="google_place_id"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJ..."
          required
        />
        <p className="text-sm text-muted-foreground">
          Find your Place ID using{' '}
          <a
            href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline inline-flex items-center gap-1"
          >
            Google Place ID Finder
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Saving...' : 'Save Place ID'}
      </Button>
    </form>
  );
}
