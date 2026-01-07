'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { LocationSearch } from '@/components/ui/location-search'
import { Select } from '@/components/ui/select-radix'
import { cn } from '@/lib/utils'

type SearchTab = 'buy' | 'rent' | 'agents'

const radiusOptions = [
  { label: 'RADIUS', value: '' },
  { label: '1 mile', value: '1' },
  { label: '3 miles', value: '3' },
  { label: '5 miles', value: '5' },
  { label: '10 miles', value: '10' },
  { label: '15 miles', value: '15' },
  { label: '20 miles', value: '20' },
]

export function PropertySearch() {
  const [activeTab, setActiveTab] = useState<SearchTab>('buy')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationLat, setLocationLat] = useState('')
  const [locationLng, setLocationLng] = useState('')
  const [radius, setRadius] = useState('')
  const router = useRouter()

  // Handle location change from autocomplete
  const handleLocationChange = (value: string, coords?: { lat: number; lng: number }) => {
    setSearchQuery(value)
    if (coords) {
      setLocationLat(coords.lat.toString())
      setLocationLng(coords.lng.toString())
    } else {
      // Clear coords if manual input (will geocode on server)
      setLocationLat('')
      setLocationLng('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (activeTab === 'agents') {
      // Navigate to agents page with search
      router.push("/agents" + (searchQuery ? "?search=" + encodeURIComponent(searchQuery) : ""))
    } else {
      // Navigate to buy/rent page with location search
      const path = activeTab === 'buy' ? '/buy' : '/rent'
      const params = new URLSearchParams()

      if (searchQuery) {
        params.set('location', searchQuery)
      }
      if (locationLat && locationLng) {
        params.set('lat', locationLat)
        params.set('lng', locationLng)
      }
      if (radius) {
        params.set('radius', radius)
      }

      const queryString = params.toString()
      router.push(path + (queryString ? '?' + queryString : ''))
    }
  }

  const isPropertySearch = activeTab === 'buy' || activeTab === 'rent'

  return (
    <div className="w-full">
      {/* Tabs - left justified, touching search bar */}
      <div className="flex justify-start">
        {(['buy', 'rent', 'agents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-sm uppercase tracking-[0.15em] transition-all px-5 py-3',
              activeTab === tab
                ? 'text-white bg-nest-brown font-normal'
                : 'text-white/80 hover:text-white font-semibold'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Input with dark button - border only here */}
      <form onSubmit={handleSubmit} className="flex border-2 border-nest-brown">
        {isPropertySearch ? (
          <>
            {/* Location Search with autocomplete */}
            <div className="flex-1 bg-white">
              <LocationSearch
                value={searchQuery}
                onChange={handleLocationChange}
                placeholder="WHERE WOULD YOU LIKE TO LIVE?"
                placeholderMobile="Location"
                variant="light"
                className="h-full"
              />
            </div>

            {/* Radius dropdown */}
            <div className="hidden sm:block w-[140px] border-l border-nest-gray/30">
              <Select
                value={radius}
                onValueChange={setRadius}
                placeholder="RADIUS"
                options={radiusOptions}
                variant="light"
                className="h-full border-0 rounded-none"
              />
            </div>
          </>
        ) : (
          /* Agents tab - plain text input */
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH FOR AN AGENT..."
            className="flex-1 bg-white px-6 py-4 text-[15px] font-medium tracking-[0.1em] text-black placeholder:text-black/50 placeholder:uppercase focus:outline-none"
          />
        )}

        <button
          type="submit"
          className="bg-nest-brown px-6 flex items-center justify-center hover:bg-nest-brown/90 transition-colors"
          aria-label="Search"
        >
          <Icon name="search" size={24} className="text-white" />
        </button>
      </form>
    </div>
  )
}
