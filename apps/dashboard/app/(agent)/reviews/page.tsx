import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GMBPlaceIdForm } from '@/components/agent/gmb-place-id-form';
import { GMBReviewsWidget } from '@/components/agent/gmb-reviews-widget';

export default async function ReviewsPage() {
  const supabase = createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get agent profile with Google Place ID
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, google_place_id')
    .eq('user_id', user.id)
    .single();

  if (agentError || !agent) {
    redirect('/login');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Google My Business Reviews</h1>
        <p className="text-gray-600">
          Display your Google Business Profile reviews
        </p>
      </div>

      {agent.google_place_id ? (
        <>
          <GMBReviewsWidget placeId={agent.google_place_id} />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Update Place ID</CardTitle>
              <CardDescription>
                Change your Google My Business Place ID if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GMBPlaceIdForm currentPlaceId={agent.google_place_id} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect Google My Business</CardTitle>
            <CardDescription>
              Enter your Google Place ID to display reviews from your business profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GMBPlaceIdForm />
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How to find your Place ID:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Visit the Google Place ID Finder (link above)</li>
                <li>Search for your business name</li>
                <li>Copy the Place ID that starts with "ChIJ"</li>
                <li>Paste it in the form above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
