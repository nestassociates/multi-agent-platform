import type { Property, Agent } from '@/lib/api/types'

interface JsonLdProps {
  data: Record<string, unknown>
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * Real Estate Listing JSON-LD
 */
export function RealEstateListingJsonLd({ property }: { property: Property }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `https://nestassociates.co.uk/property/${property.slug}`,
    datePosted: property.created_at,
    ...(property.images?.[0] && { image: property.images[0].url }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address.line1,
      addressLocality: property.address.city,
      ...(property.address.county && {
        addressRegion: property.address.county,
      }),
      postalCode: property.address.postcode,
      addressCountry: 'GB',
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'GBP',
      availability:
        property.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
    },
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
  }

  return <JsonLd data={data} />
}

/**
 * Real Estate Agent JSON-LD
 */
export function RealEstateAgentJsonLd({ agent }: { agent: Agent }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    ...(agent.bio && { description: agent.bio }),
    url: `https://nestassociates.co.uk/agent/${agent.id}`,
    ...(agent.avatar_url && { image: agent.avatar_url }),
    email: agent.email,
    ...(agent.phone && { telephone: agent.phone }),
    ...(agent.territories?.length && {
      areaServed: agent.territories.map((t) => ({
        '@type': 'Place',
        name: t.name,
      })),
    }),
  }

  return <JsonLd data={data} />
}

/**
 * Organization JSON-LD for site-wide use
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Nest Associates',
    url: 'https://nestassociates.co.uk',
    logo: 'https://nestassociates.co.uk/logo.png',
    description:
      'Connecting you with local property experts across the UK.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@nestassociates.co.uk',
    },
    sameAs: [
      'https://www.facebook.com/nestassociates',
      'https://www.instagram.com/nestassociates',
      'https://www.linkedin.com/company/nestassociates',
    ],
  }

  return <JsonLd data={data} />
}

/**
 * Article JSON-LD for blog posts
 */
export function ArticleJsonLd({
  title,
  description,
  image,
  publishedAt,
  updatedAt,
  author,
  pathname,
}: {
  title: string
  description?: string
  image?: string
  publishedAt?: string
  updatedAt?: string
  author?: string
  pathname: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description && { description }),
    ...(image && { image }),
    ...(publishedAt && { datePublished: publishedAt }),
    ...(updatedAt && { dateModified: updatedAt }),
    url: `https://nestassociates.co.uk${pathname}`,
    publisher: {
      '@type': 'Organization',
      name: 'Nest Associates',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nestassociates.co.uk/logo.png',
      },
    },
    ...(author && {
      author: {
        '@type': 'Person',
        name: author,
      },
    }),
  }

  return <JsonLd data={data} />
}

/**
 * FAQPage JSON-LD
 */
export function FAQJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }

  return <JsonLd data={data} />
}
