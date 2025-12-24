import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { getProperties } from '@/lib/api/dashboard'
import { PropertyGrid, PropertySearchBar, NoResults } from '@/components/property'
import { Skeleton } from '@/components/ui/skeleton'
import { CTABanner } from '@/components/cta'
import type { PropertyFilters as PropertyFiltersType } from '@/lib/api/types'

export const metadata: Metadata = {
  title: 'Properties for Sale | Nest Associates',
  description:
    'Browse our selection of properties for sale. Find your perfect home with Nest Associates - connecting you with local property experts across the UK.',
  openGraph: {
    title: 'Properties for Sale | Nest Associates',
    description:
      'Browse our selection of properties for sale. Find your perfect home with Nest Associates.',
    type: 'website',
  },
}

interface BuyPageProps {
  searchParams: Promise<{
    location?: string
    min_price?: string
    max_price?: string
    min_bedrooms?: string
    max_bedrooms?: string
    property_type?: string
    radius?: string
    inc_sold?: string
    sort?: string
    page?: string
  }>
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white p-3">
      <Skeleton className="aspect-[4/3]" />
      <div className="flex items-end justify-between pt-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

function PropertyGridSkeleton() {
  return (
    <>
      {/* First batch of 6 properties */}
      <div className="container-wide">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* CTA Banner skeleton */}
      <div className="container-wide">
        <Skeleton className="my-12 h-[200px] md:h-[240px]" />
      </div>

      {/* Second batch of 6 properties */}
      <div className="container-wide pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i + 6} />
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="container-wide pb-12 flex items-center justify-center gap-6">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-5" />
      </div>
    </>
  )
}

function buildPageUrl(basePath: string, params: Record<string, string | undefined>, page: number) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') {
      searchParams.set(key, value)
    }
  })
  searchParams.set('page', page.toString())
  return `${basePath}?${searchParams.toString()}`
}

async function PropertyResultsWithCTA({
  filters,
  page,
  searchParams,
}: {
  filters: PropertyFiltersType
  page: number
  searchParams: Record<string, string | undefined>
}) {
  const result = await getProperties(filters)

  if (result.data.length === 0) {
    return <NoResults resetHref="/buy" />
  }

  // Split properties: first 6, CTA, then remaining
  const firstBatch = result.data.slice(0, 6)
  const secondBatch = result.data.slice(6, 12)

  return (
    <>
      {/* First 6 properties */}
      <div className="container-wide">
        <PropertyGrid properties={firstBatch} />
      </div>

      {/* Valuation CTA Banner - contained width */}
      <div className={`container-wide ${secondBatch.length === 0 ? 'pb-12' : ''}`}>
        <CTABanner
          heading="Curious how much your home is worth?"
          buttonText="Request Valuation"
          buttonHref="/sell"
        />
      </div>

      {/* Second batch of properties (up to 6 more) */}
      {secondBatch.length > 0 && (
        <div className="container-wide pb-12">
          <PropertyGrid properties={secondBatch} />
        </div>
      )}

      {/* Pagination */}
      {result.pagination.totalPages > 1 && (
        <div className="container-wide pb-12 flex items-center justify-center gap-6">
          {page > 1 ? (
            <Link
              href={buildPageUrl('/buy', searchParams, page - 1)}
              className="text-black hover:opacity-70 transition-opacity"
              aria-label="Previous page"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          ) : (
            <span className="text-black/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
          )}
          <span className="text-base text-black tracking-wide">
            {page} - {result.pagination.totalPages}
          </span>
          {page < result.pagination.totalPages ? (
            <Link
              href={buildPageUrl('/buy', searchParams, page + 1)}
              className="text-black hover:opacity-70 transition-opacity"
              aria-label="Next page"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ) : (
            <span className="text-black/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </div>
      )}
    </>
  )
}

export default async function BuyPage({ searchParams }: BuyPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1

  const filters: PropertyFiltersType = {
    transaction_type: 'sale',
    // Include sold/under_offer by default, allow hiding with inc_sold=false
    status: params.inc_sold === 'false' ? 'available' : 'all',
    location: params.location,
    min_price: params.min_price ? parseInt(params.min_price) : undefined,
    max_price: params.max_price ? parseInt(params.max_price) : undefined,
    min_bedrooms: params.min_bedrooms ? parseInt(params.min_bedrooms) : undefined,
    max_bedrooms: params.max_bedrooms ? parseInt(params.max_bedrooms) : undefined,
    property_type: params.property_type,
    // Default to highest price first
    sort: (params.sort as PropertyFiltersType['sort']) || 'price_desc',
    page,
    limit: 12,
  }

  return (
    <div className="bg-[#E8E8E8] bg-[url('/images/wall-shadow-bg.jpg')] bg-cover bg-center bg-fixed">
      {/* Search Bar */}
      <PropertySearchBar transactionType="sale" />

      {/* Property Grid with CTA in middle */}
      <Suspense fallback={<div className="container-wide"><PropertyGridSkeleton /></div>}>
        <PropertyResultsWithCTA filters={filters} page={page} searchParams={params} />
      </Suspense>
    </div>
  )
}
