import { Search, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NoResultsProps {
  title?: string
  message?: string
  showResetButton?: boolean
  resetHref?: string
}

export function NoResults({
  title = 'No properties found',
  message = "We couldn't find any properties matching your criteria. Try adjusting your filters or search for a different location.",
  showResetButton = true,
  resetHref,
}: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="mb-6 max-w-md text-muted-foreground">{message}</p>
      {showResetButton && (
        <div className="flex gap-3">
          {resetHref && (
            <Button variant="outline" asChild>
              <Link href={resetHref}>
                <Home className="mr-2 h-4 w-4" />
                Clear Filters
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/register">Register for Alerts</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
