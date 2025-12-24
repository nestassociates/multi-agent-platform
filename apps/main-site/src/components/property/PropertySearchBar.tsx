'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useEffect, useRef } from 'react'
import { Search, SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react'

interface PropertySearchBarProps {
  transactionType: 'sale' | 'rental'
}

const minPriceOptionsSale = [
  { label: 'MIN PRICE', value: '' },
  { label: '£50,000', value: '50000' },
  { label: '£100,000', value: '100000' },
  { label: '£150,000', value: '150000' },
  { label: '£200,000', value: '200000' },
  { label: '£250,000', value: '250000' },
  { label: '£300,000', value: '300000' },
  { label: '£400,000', value: '400000' },
  { label: '£500,000', value: '500000' },
  { label: '£750,000', value: '750000' },
  { label: '£1,000,000', value: '1000000' },
]

const maxPriceOptionsSale = [
  { label: 'MAX PRICE', value: '' },
  { label: '£100,000', value: '100000' },
  { label: '£150,000', value: '150000' },
  { label: '£200,000', value: '200000' },
  { label: '£250,000', value: '250000' },
  { label: '£300,000', value: '300000' },
  { label: '£400,000', value: '400000' },
  { label: '£500,000', value: '500000' },
  { label: '£750,000', value: '750000' },
  { label: '£1,000,000', value: '1000000' },
  { label: '£2,000,000+', value: '2000000' },
]

const minPriceOptionsRental = [
  { label: 'MIN PRICE', value: '' },
  { label: '£500 pcm', value: '500' },
  { label: '£750 pcm', value: '750' },
  { label: '£1,000 pcm', value: '1000' },
  { label: '£1,250 pcm', value: '1250' },
  { label: '£1,500 pcm', value: '1500' },
  { label: '£2,000 pcm', value: '2000' },
  { label: '£2,500 pcm', value: '2500' },
  { label: '£3,000 pcm', value: '3000' },
]

const maxPriceOptionsRental = [
  { label: 'MAX PRICE', value: '' },
  { label: '£750 pcm', value: '750' },
  { label: '£1,000 pcm', value: '1000' },
  { label: '£1,250 pcm', value: '1250' },
  { label: '£1,500 pcm', value: '1500' },
  { label: '£2,000 pcm', value: '2000' },
  { label: '£2,500 pcm', value: '2500' },
  { label: '£3,000 pcm', value: '3000' },
  { label: '£4,000 pcm', value: '4000' },
  { label: '£5,000+ pcm', value: '5000' },
]

const minBedsOptions = [
  { label: 'MIN BEDS', value: '' },
  { label: 'Studio', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5+', value: '5' },
]

const maxBedsOptions = [
  { label: 'MAX BEDS', value: '' },
  { label: 'Studio', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5+', value: '5' },
]

const propertyTypes = [
  { label: 'PROPERTY TYPE', value: '' },
  { label: 'House', value: 'house' },
  { label: 'Flat', value: 'flat' },
  { label: 'Bungalow', value: 'bungalow' },
  { label: 'Maisonette', value: 'maisonette' },
  { label: 'Land', value: 'land' },
  { label: 'Commercial', value: 'commercial' },
]

const radiusOptions = [
  { label: 'RADIUS', value: '' },
  { label: '1 mile', value: '1' },
  { label: '3 miles', value: '3' },
  { label: '5 miles', value: '5' },
  { label: '10 miles', value: '10' },
  { label: '15 miles', value: '15' },
  { label: '20 miles', value: '20' },
]

const incSoldOptions = [
  { label: 'INC SOLD', value: '' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
]

export function PropertySearchBar({ transactionType }: PropertySearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Controlled state for all form fields (shared between desktop and mobile)
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [minBeds, setMinBeds] = useState(searchParams.get('min_bedrooms') || '')
  const [maxBeds, setMaxBeds] = useState(searchParams.get('max_bedrooms') || '')
  const [propertyType, setPropertyType] = useState(searchParams.get('property_type') || '')
  const [radius, setRadius] = useState(searchParams.get('radius') || '')
  const [incSold, setIncSold] = useState(searchParams.get('inc_sold') || '')

  // Sync state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setLocation(searchParams.get('location') || '')
    setMinPrice(searchParams.get('min_price') || '')
    setMaxPrice(searchParams.get('max_price') || '')
    setMinBeds(searchParams.get('min_bedrooms') || '')
    setMaxBeds(searchParams.get('max_bedrooms') || '')
    setPropertyType(searchParams.get('property_type') || '')
    setRadius(searchParams.get('radius') || '')
    setIncSold(searchParams.get('inc_sold') || '')
  }, [searchParams])

  // Handle responsive placeholder
  useEffect(() => {
    const updatePlaceholder = () => {
      if (locationInputRef.current) {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches
        locationInputRef.current.placeholder = isDesktop
          ? 'Search by address, postcode, town, area. etc'
          : 'Location'
      }
    }

    updatePlaceholder()
    window.addEventListener('resize', updatePlaceholder)
    return () => window.removeEventListener('resize', updatePlaceholder)
  }, [])

  const minPriceOptions = transactionType === 'sale' ? minPriceOptionsSale : minPriceOptionsRental
  const maxPriceOptions = transactionType === 'sale' ? maxPriceOptionsSale : maxPriceOptionsRental

  const createQueryString = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      params.delete('page')
      return params.toString()
    },
    [searchParams]
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Use controlled state values directly instead of FormData
    const updates: Record<string, string> = {
      location,
      min_price: minPrice,
      max_price: maxPrice,
      min_bedrooms: minBeds,
      max_bedrooms: maxBeds,
      property_type: propertyType,
      radius,
      inc_sold: incSold,
    }

    router.push(pathname + '?' + createQueryString(updates), { scroll: false })
  }

  const handleClear = () => {
    // Reset all state
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    setMinBeds('')
    setMaxBeds('')
    setPropertyType('')
    setRadius('')
    setIncSold('')
    // Navigate to base URL
    router.push(pathname, { scroll: false })
  }

  // Check if any filters are active
  const hasActiveFilters = location || minPrice || maxPrice || minBeds || maxBeds || propertyType || radius || incSold

  const selectClass =
    'h-[50px] w-full appearance-none border border-white bg-transparent px-4 pr-10 text-[14px] uppercase tracking-[1px] text-white focus:outline-none cursor-pointer'

  return (
    <div className="bg-[#5C5A58] mb-8">
      <form onSubmit={handleSubmit}>
        {/* Search Bar Row */}
        <div className="container-wide py-6">
          <div className="flex items-center gap-2">
            {/* Search Input - single input with responsive placeholder */}
            <div className="flex-1">
              <input
                ref={locationInputRef}
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-[50px] w-full border-0 bg-white px-4 text-[14px] text-black placeholder:text-black/60 focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="flex h-[50px] w-[50px] items-center justify-center border border-white"
              aria-label="Search"
            >
              <Search className="h-6 w-6 text-white" strokeWidth={1.5} />
            </button>

            {/* Filter Toggle Button */}
            <button
              type="button"
              className="flex h-[50px] w-[50px] items-center justify-center border border-white"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              {showFilters ? (
                <X className="h-6 w-6 text-white" strokeWidth={1.5} />
              ) : (
                <SlidersHorizontal className="h-6 w-6 text-white" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel - toggleable with animation */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="container-wide pb-6">
            {/* Desktop: 2 rows of 4 */}
            <div className="hidden md:block">
              {/* Row 1 */}
              <div className="mb-2 grid grid-cols-4 gap-2">
                <div className="relative">
                  <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className={selectClass}>
                    {minBedsOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
                <div className="relative">
                  <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={selectClass}>
                    {minPriceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
                <div className="relative">
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectClass}>
                    {propertyTypes.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
                <div className="relative">
                  <select value={radius} onChange={(e) => setRadius(e.target.value)} className={selectClass}>
                    {radiusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-4 gap-2">
                <div className="relative">
                  <select value={maxBeds} onChange={(e) => setMaxBeds(e.target.value)} className={selectClass}>
                    {maxBedsOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
                <div className="relative">
                  <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={selectClass}>
                    {maxPriceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                </div>
                {transactionType === 'sale' ? (
                  <div className="relative">
                    <select value={incSold} onChange={(e) => setIncSold(e.target.value)} className={selectClass}>
                      {incSoldOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`h-[50px] bg-white text-[14px] uppercase tracking-[1px] text-black hover:bg-white/90 ${hasActiveFilters ? 'flex-1' : 'w-full'}`}
                  >
                    Search
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="h-[50px] px-4 border border-white text-[14px] uppercase tracking-[1px] text-white hover:bg-white/10"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: Single column stack */}
            <div className="flex flex-col gap-2 md:hidden">
              <div className="relative">
                <select value={radius} onChange={(e) => setRadius(e.target.value)} className={selectClass}>
                  {radiusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              <div className="relative">
                <select value={minBeds} onChange={(e) => setMinBeds(e.target.value)} className={selectClass}>
                  {minBedsOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              <div className="relative">
                <select value={maxBeds} onChange={(e) => setMaxBeds(e.target.value)} className={selectClass}>
                  {maxBedsOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              <div className="relative">
                <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className={selectClass}>
                  {minPriceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              <div className="relative">
                <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={selectClass}>
                  {maxPriceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              <div className="relative">
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectClass}>
                  {propertyTypes.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#5C5A58] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white" />
              </div>
              {transactionType === 'sale' && (
                <label className="flex h-[50px] cursor-pointer items-center justify-between border border-white px-4">
                  <span className="text-[14px] uppercase tracking-[1px] text-white">INC SOLD</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={incSold === 'true'}
                      onChange={(e) => setIncSold(e.target.checked ? 'true' : '')}
                      className="peer sr-only"
                    />
                    <div className="h-8 w-14 border border-white bg-transparent" />
                    <div className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center bg-white transition-transform duration-200 ${incSold === 'true' ? 'translate-x-6' : ''}`}>
                      {incSold === 'true' && <Check className="h-4 w-4 text-[#5C5A58]" />}
                    </div>
                  </div>
                </label>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`h-[50px] bg-white text-[14px] uppercase tracking-[1px] text-black hover:bg-white/90 ${hasActiveFilters ? 'flex-1' : 'w-full'}`}
                >
                  Search
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-[50px] px-4 border border-white text-[14px] uppercase tracking-[1px] text-white hover:bg-white/10"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
