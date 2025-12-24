'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PropertyFiltersProps {
  transactionType: 'sale' | 'rental'
}

const minPriceOptions = [
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

const maxPriceOptions = [
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

export function PropertyFilters({ transactionType: _transactionType }: PropertyFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
    const formData = new FormData(e.currentTarget)
    const updates: Record<string, string> = {}

    formData.forEach((value, key) => {
      updates[key] = value.toString()
    })

    router.push(pathname + '?' + createQueryString(updates), { scroll: false })
  }

  const currentLocation = searchParams.get('location') || ''
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''
  const currentMinBeds = searchParams.get('min_bedrooms') || ''
  const currentMaxBeds = searchParams.get('max_bedrooms') || ''
  const currentPropertyType = searchParams.get('property_type') || ''
  const currentRadius = searchParams.get('radius') || ''
  const currentIncSold = searchParams.get('inc_sold') || ''

  const selectClass = "h-10 w-full border border-nest-gray bg-white px-3 py-2 text-xs uppercase tracking-wide text-black focus:border-black focus:outline-none appearance-none cursor-pointer"

  return (
    <div className="border border-nest-gray bg-white">
      {/* Search Bar */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center border-b border-nest-gray">
          <div className="flex-1 flex items-center px-4">
            <Search className="h-4 w-4 text-nest-brown" />
            <input
              name="location"
              placeholder="Search by address, postcode, town, area etc"
              defaultValue={currentLocation}
              className="flex-1 border-0 bg-transparent px-3 py-4 text-sm placeholder:text-nest-brown focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="border-l border-nest-gray p-4 lg:hidden"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:grid lg:grid-cols-7 lg:gap-0">
          <select name="min_bedrooms" defaultValue={currentMinBeds} className={selectClass}>
            {minBedsOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="min_price" defaultValue={currentMinPrice} className={selectClass}>
            {minPriceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="property_type" defaultValue={currentPropertyType} className={selectClass}>
            {propertyTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="radius" defaultValue={currentRadius} className={selectClass}>
            {radiusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="max_bedrooms" defaultValue={currentMaxBeds} className={selectClass}>
            {maxBedsOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="max_price" defaultValue={currentMaxPrice} className={selectClass}>
            {maxPriceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select name="inc_sold" defaultValue={currentIncSold} className={selectClass}>
            {incSoldOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Desktop Search Button */}
        <div className="hidden lg:block border-t border-nest-gray">
          <div className="flex justify-end p-4">
            <Button type="submit" className="bg-black text-white hover:bg-black/90 px-8">
              SEARCH
            </Button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden border-t border-nest-gray p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select name="min_bedrooms" defaultValue={currentMinBeds} className={selectClass}>
                {minBedsOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select name="max_bedrooms" defaultValue={currentMaxBeds} className={selectClass}>
                {maxBedsOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select name="min_price" defaultValue={currentMinPrice} className={selectClass}>
                {minPriceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select name="max_price" defaultValue={currentMaxPrice} className={selectClass}>
                {maxPriceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select name="property_type" defaultValue={currentPropertyType} className={selectClass}>
                {propertyTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select name="radius" defaultValue={currentRadius} className={selectClass}>
                {radiusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full bg-black text-white hover:bg-black/90">
              SEARCH
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
