import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Video, Facebook, Instagram } from 'lucide-react'
import { getPropertyBySlug } from '@/lib/api/dashboard'
import { generatePropertyMetadata } from '@/lib/seo/metadata'
import { RealEstateListingJsonLd } from '@/components/seo/JsonLd'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import {
  PropertyGallery,
  PropertyStats,
  PropertyDescription,
  PropertyDetails,
  PropertyAccordions,
  PropertyMap,
  ViewingRequestForm,
  AgentOtherProperties,
  AgentReviews,
  ShareDropdown,
} from '@/components/property'

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

interface PropertyPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params
  const property = await getPropertyBySlug(slug)

  if (!property) {
    return {
      title: 'Property Not Found | Nest Associates',
    }
  }

  return generatePropertyMetadata({
    title: property.title,
    price: property.price,
    bedrooms: property.bedrooms,
    address: `${property.address.line1}, ${property.address.town}`,
    image: property.images?.[0]?.url,
    pathname: `/property/${property.slug}`,
  })
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params
  const property = await getPropertyBySlug(slug)

  if (!property) {
    notFound()
  }

  const location = property.address?.town || 'Location'
  const propertyUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://nestassociates.co.uk/property/${property.slug}`

  // Scroll to form function ID
  const formSectionId = 'viewing-request-form'

  return (
    <>
      <RealEstateListingJsonLd property={property} />

      <div className="container-wide py-8">
        <div className="space-y-8">
          {/* Main Content - Full Width */}
          <div>
            {/* Gallery with status badge */}
            <div className="relative">
              <PropertyGallery
                images={property.images}
                title={property.title}
              />
              {/* Status Badge - SVG */}
              {(() => {
                const badgeSrc = getStatusBadge(property.status, property.transaction_type)
                if (!badgeSrc) return null
                return (
                  <div className="absolute left-8 top-0 z-10 lg:left-16">
                    <Image
                      src={badgeSrc}
                      alt={property.status === 'sold' ? 'Sold' :
                           property.status === 'under_offer' ? 'Sold Subject to Contract' :
                           property.status === 'let' ? 'Let' : 'Let Agreed'}
                      width={172}
                      height={172}
                      className="h-[88px] w-auto lg:h-[172px]"
                    />
                  </div>
                )
              })()}
            </div>

            {/* Price, Location, and Actions */}
            <div className="mt-6 flex items-start justify-between">
              <div>
                <p className="text-3xl font-medium text-black">
                  {formatPrice(property.price)}
                  {property.transaction_type === 'rental' && (
                    <span className="text-lg font-normal text-nest-brown"> pcm</span>
                  )}
                </p>
                <p className="mt-1 text-sm uppercase tracking-nest text-black">
                  {location}
                </p>
              </div>
              {/* Action Icons */}
              <div className="flex items-center gap-2">
                {property.virtual_tour_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-nest-brown hover:text-nest-olive"
                  >
                    <a
                      href={property.virtual_tour_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View video tour"
                    >
                      <Video className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                <ShareDropdown url={propertyUrl} title={property.title} />
              </div>
            </div>

            {/* Property Stats Row */}
            <div className="mt-6">
              <PropertyStats
                propertyType={property.property_type}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                sizeSqft={property.size_sqft || null}
                tenure={property.tenure || null}
              />
            </div>

            {/* Request Viewing Button + Agent Card */}
            <div className="flex flex-col gap-6 border-y border-nest-gray py-8 md:flex-row md:items-center md:justify-between">
              {/* Request Viewing Button */}
              <Button className="w-full md:w-auto md:min-w-[300px]" size="lg" asChild>
                <a href={`#${formSectionId}`}>Request Viewing</a>
              </Button>

              {/* Agent Card - Inline */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium uppercase tracking-nest text-black">
                    {property.agent.name}
                  </p>
                  {property.agent.phone && (
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="mt-1 block text-sm text-nest-brown hover:text-nest-olive"
                    >
                      {property.agent.phone}
                    </a>
                  )}
                  {/* Social Links */}
                  {property.agent.social_media && (
                    <div className="mt-2 flex justify-end gap-2">
                      {property.agent.social_media.facebook && (
                        <a
                          href={property.agent.social_media.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-nest-olive"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {property.agent.social_media.instagram && (
                        <a
                          href={property.agent.social_media.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-nest-olive"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {/* Agent Photo */}
                {property.agent.avatar_url && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-nest-gray">
                    <Image
                      src={property.agent.avatar_url}
                      alt={property.agent.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
              </div>
            </div>


            {/* About the Property - Description and Features */}
            <PropertyDescription
              description={property.description}
              features={property.features}
            />

            {/* Property Details Grid */}
            <PropertyDetails
              councilTaxBand={property.council_tax_band || null}
              parking={property.parking || null}
              garden={property.garden || null}
              accessibility={property.accessibility || null}
            />

            {/* Collapsible Accordion Sections */}
            <PropertyAccordions
              floorPlanUrl={property.floorplan_url}
              utilities={property.utilities}
              epc={property.epc}
              epcImages={property.epc_images}
              propertyTitle={property.title}
            />

            {/* Property Location Map */}
            <PropertyMap
              latitude={property.location?.latitude || null}
              longitude={property.location?.longitude || null}
              title={property.title}
            />
          </div>

        </div>
      </div>

      {/* Request a Viewing Form Section */}
      <section id={formSectionId} className="bg-nest-pink py-16">
        <div className="container-wide">
          <h2 className="text-center text-xl font-medium uppercase tracking-nest text-black">
            Request a Viewing
          </h2>
          <div className="mt-8">
            <ViewingRequestForm
              agentId={property.agent.id}
              propertyId={property.id}
              apex27ListingId={property.apex27_id}
              sourcePage={`/property/${property.slug}`}
            />
          </div>
        </div>
      </section>

      {/* Agent Reviews Section */}
      <AgentReviews
        agentName={property.agent.name}
        googlePlaceId={property.agent.google_place_id || null}
      />

      {/* Agent's Other Properties Carousel */}
      <AgentOtherProperties
        agentId={property.agent.id}
        agentName={property.agent.name}
        currentPropertyId={property.id}
      />
    </>
  )
}
