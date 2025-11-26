'use client';

import { Card, CardContent } from '@/components/ui/card';

export function GMBReviewsWidget({ placeId }: { placeId: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">
            Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full overflow-hidden rounded-lg" style={{ height: '600px' }}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`}
            allowFullScreen
            className="w-full h-full"
            title="Google My Business Reviews"
          />
        </div>
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            Reviews displayed from Google My Business
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
