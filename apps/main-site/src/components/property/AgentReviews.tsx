import { Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AgentReviewsProps {
  agentName: string
  googlePlaceId: string | null
}

// Google My Business review URL format
const GMB_REVIEW_URL = 'https://search.google.com/local/reviews'

export function AgentReviews({ agentName, googlePlaceId }: AgentReviewsProps) {
  // Don't render if agent has no Google Place ID
  if (!googlePlaceId) {
    return null
  }

  const reviewsUrl = `${GMB_REVIEW_URL}?placeid=${googlePlaceId}`

  return (
    <section className="bg-white py-16">
      <div className="container-wide">
        <h2 className="text-center text-xl font-medium uppercase tracking-nest text-black">
          Client Reviews
        </h2>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-6 w-6 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>

          <p className="mt-4 text-sm text-nest-brown">
            See what clients are saying about {agentName}
          </p>

          <Button
            variant="outline"
            className="mt-6"
            asChild
          >
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Read Reviews on Google
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
