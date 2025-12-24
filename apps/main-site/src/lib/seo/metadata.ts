import type { Metadata } from 'next'

const SITE_NAME = 'Nest Associates'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nestassociates.co.uk'
const DEFAULT_DESCRIPTION =
  'Find your perfect property with Nest Associates - connecting you with local property experts across the UK.'

interface GenerateMetadataOptions {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  pathname?: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
}

/**
 * Generate metadata for a page
 */
export function generatePageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  image,
  pathname = '',
  noIndex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
}: GenerateMetadataOptions): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${pathname}`
  const ogImage = image || `${SITE_URL}/api/og?title=${encodeURIComponent(title)}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : undefined,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

/**
 * Generate metadata for property listing pages
 */
export function generatePropertyMetadata({
  title,
  price,
  bedrooms,
  address,
  image,
  pathname,
}: {
  title: string
  price: number
  bedrooms: number
  address: string
  image?: string
  pathname: string
}): Metadata {
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(price)

  const description = `${bedrooms} bedroom property in ${address} - ${formattedPrice}. View details, photos and arrange a viewing with Nest Associates.`

  return generatePageMetadata({
    title,
    description,
    keywords: ['property', 'real estate', address, `${bedrooms} bedroom`],
    image,
    pathname,
    type: 'website',
  })
}

/**
 * Generate metadata for agent profile pages
 */
export function generateAgentMetadata({
  name,
  bio,
  location,
  image,
  pathname,
}: {
  name: string
  bio?: string
  location?: string
  image?: string
  pathname: string
}): Metadata {
  const description =
    bio ||
    `Meet ${name}${location ? ` - your local property expert in ${location}` : ''}.Contact ${name} for expert property advice.`

  return generatePageMetadata({
    title: name,
    description,
    keywords: ['estate agent', 'property expert', name, location].filter(
      Boolean
    ) as string[],
    image,
    pathname,
    type: 'website',
  })
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogMetadata({
  title,
  excerpt,
  image,
  pathname,
  publishedAt,
  updatedAt,
  author,
  category,
}: {
  title: string
  excerpt?: string
  image?: string
  pathname: string
  publishedAt?: string
  updatedAt?: string
  author?: string
  category?: string
}): Metadata {
  return generatePageMetadata({
    title,
    description: excerpt,
    keywords: ['property advice', 'real estate blog', category].filter(
      Boolean
    ) as string[],
    image,
    pathname,
    type: 'article',
    publishedTime: publishedAt,
    modifiedTime: updatedAt,
    author,
  })
}
