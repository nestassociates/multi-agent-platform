import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import type { Property, PropertyCard as PropertyCardType } from '@/lib/api/types'

interface PropertyCardProps {
  property: Property | PropertyCardType
}

// Get the status badge SVG path based on property status and transaction type
function getStatusBadge(status: string | null, transactionType: string): string | null {
  if (!status || status === 'available') return null

  if (transactionType === 'rental') {
    // Lettings badges
    if (status === 'let') return '/images/badges/LET.svg'
    if (status === 'let_agreed') return '/images/badges/LET-STC.svg'
  } else {
    // Sales badges
    if (status === 'sold') return '/images/badges/SOLD.svg'
    if (status === 'under_offer') return '/images/badges/SOLD-STC.svg'
  }

  return null
}

// Alt text for status badges
const statusAltText: Record<string, string> = {
  sold: 'Sold',
  under_offer: 'Sold Subject to Contract',
  let: 'Let',
  let_agreed: 'Let Agreed',
}

export function PropertyCard({ property }: PropertyCardProps) {
  // Use featured_image_url (thumbnail from API) or fallback to first image
  const images = 'images' in property ? property.images : undefined
  const imageUrl = property.featured_image_url || images?.[0]?.url
  const imageAlt = images?.[0]?.alt || property.title
  const isPricePerMonth = property.transaction_type === 'rental'
  const badgeSrc = getStatusBadge(property.status, property.transaction_type)
  const address = property.address as { town?: string; city?: string }
  const location = address?.town || address?.city || 'Location'

  return (
    <Link href={`/property/${property.slug}`} className="group relative block bg-white p-3">
      {/* Status Badge - SVG - positioned relative to white container */}
      {badgeSrc && (
        <div className="absolute left-[25px] top-0 z-10">
          <Image
            src={badgeSrc}
            alt={statusAltText[property.status] || ''}
            width={100}
            height={100}
            className="h-[100px] w-auto"
          />
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-nest-gray">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon name="property-type" size={48} className="opacity-30" />
          </div>
        )}
      </div>

      {/* Content - Location/Price left, Icons right */}
      <div className="flex items-end justify-between pt-3">
        {/* Left: Location & Price */}
        <div>
          <p className="text-[17px] uppercase leading-[21px] text-black">
            {location}
          </p>
          <p className="text-[17px] font-bold leading-[21px] text-black">
            {formatPrice(property.price)}
            {isPricePerMonth && (
              <span className="text-sm font-normal text-nest-brown"> pcm</span>
            )}
          </p>
        </div>

        {/* Right: Icons with numbers */}
        <div className="flex items-center gap-2 text-nest-brown">
          {/* Bedrooms */}
          <div className="flex items-center gap-1">
            <span className="text-[17px]">{property.bedrooms}</span>
            <Icon name="bedrooms" size={20} />
          </div>

          {/* Bathrooms */}
          <div className="flex items-center gap-1">
            <span className="text-[17px]">{property.bathrooms}</span>
            <Icon name="bathroom" size={20} />
          </div>
        </div>
      </div>
    </Link>
  )
}
