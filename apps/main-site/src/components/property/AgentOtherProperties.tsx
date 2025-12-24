'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PropertyCard } from './PropertyCard'
import type { PropertyCard as PropertyCardType } from '@/lib/api/types'

interface AgentOtherPropertiesProps {
  agentId: string
  agentName: string
  currentPropertyId: string
}

const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || ''

export function AgentOtherProperties({
  agentId,
  agentName,
  currentPropertyId,
}: AgentOtherPropertiesProps) {
  const [properties, setProperties] = useState<PropertyCardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Extract first name for title
  const firstName = agentName.split(' ')[0]

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch(
          `${DASHBOARD_API_URL}/api/public/agents/${agentId}/properties?exclude=${currentPropertyId}&limit=10&status=available`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch')
        }

        const data = await response.json()
        setProperties(data.data || data || [])
      } catch (error) {
        console.error('Error fetching agent properties:', error)
        setProperties([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [agentId, currentPropertyId])

  // Don't render section if agent has no other properties
  if (!isLoading && properties.length === 0) {
    return null
  }

  const visibleCount = 3 // Number of properties visible at once
  const canScrollLeft = currentIndex > 0
  const canScrollRight = currentIndex < properties.length - visibleCount

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const scrollRight = () => {
    setCurrentIndex((prev) => Math.min(properties.length - visibleCount, prev + 1))
  }

  return (
    <section className="py-16">
      <div className="container-wide">
        <h2 className="text-center text-xl font-medium uppercase tracking-nest text-black">
          {firstName}&apos;s Other Properties
        </h2>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-nest-gray" />
                <div className="mt-4 h-4 w-3/4 bg-nest-gray" />
                <div className="mt-2 h-4 w-1/2 bg-nest-gray" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mt-8">
            {/* Navigation Arrows - positioned at center of image height */}
            {properties.length > visibleCount && (
              <>
                <button
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  className="absolute -left-12 top-1/3 z-10 hidden -translate-y-1/2 text-black transition-opacity hover:opacity-70 disabled:opacity-30 md:block lg:-left-16"
                  aria-label="Previous properties"
                >
                  <ChevronLeft className="h-10 w-10" strokeWidth={1.5} />
                </button>
                <button
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  className="absolute -right-12 top-1/3 z-10 hidden -translate-y-1/2 text-black transition-opacity hover:opacity-70 disabled:opacity-30 md:block lg:-right-16"
                  aria-label="Next properties"
                >
                  <ChevronRight className="h-10 w-10" strokeWidth={1.5} />
                </button>
              </>
            )}

            {/* Carousel */}
            <div ref={carouselRef} className="overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-300"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                }}
              >
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="w-full shrink-0 md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Dots Indicator */}
            {properties.length > 1 && (
              <div className="mt-6 flex justify-center gap-2 md:hidden">
                {properties.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full ${
                      index === currentIndex ? 'bg-nest-olive' : 'bg-nest-gray'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
