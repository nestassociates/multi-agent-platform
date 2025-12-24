import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getFeaturedProperties } from '@/lib/api/dashboard'
import { PropertyGrid } from '@/components/property'
import { Button } from '@/components/ui/button'

export async function FeaturedProperties() {
  const properties = await getFeaturedProperties(6)

  if (properties.length === 0) {
    return null
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container-wide">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Featured Properties
            </h2>
            <p className="mt-2 text-muted-foreground">
              Discover our latest available properties
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/buy">
              View All Properties
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <PropertyGrid properties={properties} />

        <div className="mt-8 text-center sm:hidden">
          <Button asChild>
            <Link href="/buy">
              View All Properties
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
