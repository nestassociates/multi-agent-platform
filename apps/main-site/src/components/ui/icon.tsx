'use client'

import { cn } from '@/lib/utils'

export type IconName =
  | 'bathroom'
  | 'bedrooms'
  | 'dropdown'
  | 'energy'
  | 'expand'
  | 'facebook'
  | 'filter'
  | 'floorplan'
  | 'instagram'
  | 'map-pin'
  | 'property-size'
  | 'property-type'
  | 'search'
  | 'share'
  | 'star'
  | 'swipe'
  | 'tiktok'
  | 'utilities'
  | 'video'

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

// SVG icon components - using currentColor for CSS color inheritance
const icons: Record<IconName, React.FC<{ className?: string }>> = {
  bedrooms: ({ className }) => (
    <svg viewBox="0 0 43 31" fill="none" className={className}>
      <path d="M1.5 14.5V29.5H41.5V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5.5 14.5V1.5H37.5V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5.5 10.5H16.5V14.5H5.5V10.5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M26.5 10.5H37.5V14.5H26.5V10.5Z" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1.5" y1="24.75" x2="41.5" y2="24.75" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  bathroom: ({ className }) => (
    <svg viewBox="0 0 44 42" fill="none" className={className}>
      <path d="M7 20H1.5V38.5C1.5 39.6046 2.39543 40.5 3.5 40.5H40.5C41.6046 40.5 42.5 39.6046 42.5 38.5V20H7Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 20V3.5C7 2.39543 7.89543 1.5 9 1.5H13C14.1046 1.5 15 2.39543 15 3.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 40.5V35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M36 40.5V35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <ellipse cx="22" cy="30" rx="12" ry="5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  'property-type': ({ className }) => (
    <svg viewBox="0 0 28 26" fill="none" className={className}>
      <path d="M1 10L14 1L27 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 8V24.5H24V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="10" y="15" width="8" height="9.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  'property-size': ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <rect x="1" y="1" width="28" height="28" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 8H8V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M29 22H22V29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1.53033" y1="1.46967" x2="10.5303" y2="10.4697" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="19.4697" y1="19.5303" x2="28.4697" y2="28.5303" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  search: ({ className }) => (
    <svg viewBox="0 0 33 31" fill="none" className={className}>
      <circle cx="18.5992" cy="13.4605" r="12.7105" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="0.530217" y1="30.4697" x2="8.68811" y2="22.3118" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  filter: ({ className }) => (
    <svg viewBox="0 0 30 29" fill="none" className={className}>
      <line x1="0.75" y1="6.25" x2="29.25" y2="6.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="0.75" y1="14.25" x2="29.25" y2="14.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="0.75" y1="22.25" x2="29.25" y2="22.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="6" r="3.25" fill="white" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="22" cy="14" r="3.25" fill="white" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="22" r="3.25" fill="white" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  share: ({ className }) => (
    <svg viewBox="0 0 24 28" fill="none" className={className}>
      <circle cx="19" cy="5" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5" cy="14" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="19" cy="23" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8.5" y1="12" x2="15.5" y2="7" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8.5" y1="16" x2="15.5" y2="21" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  expand: ({ className }) => (
    <svg viewBox="0 0 22 22" fill="none" className={className}>
      <path d="M1 8V1H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 14V21H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 1H21V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 21H1V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <circle cx="15" cy="15" r="14.25" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 12H16V10C16 8 17 6 20 6H22V10H20C19 10 18.5 10.5 18.5 11.5V12H22L21 16H18.5V26H14.5V16H12V12Z" fill="currentColor"/>
    </svg>
  ),
  instagram: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <rect x="1.75" y="1.75" width="26.5" height="26.5" rx="6.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="15" r="6.25" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="23" cy="7" r="2" fill="currentColor"/>
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg viewBox="0 0 26 30" fill="none" className={className}>
      <path d="M10 12V26C10 27.5 11.5 29 14 29C16.5 29 18 27.5 18 26V1H22C22 1 22 6 26 8V14C26 14 22 14 18 12V26C18 28 15.5 30 12 30C8.5 30 6 27 6 24C6 21 8 18 12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'map-pin': ({ className }) => (
    <svg viewBox="0 0 24 32" fill="none" className={className}>
      <path d="M12 1C5.925 1 1 5.925 1 12C1 20 12 31 12 31C12 31 23 20 23 12C23 5.925 18.075 1 12 1Z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  floorplan: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <rect x="1" y="1" width="28" height="28" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1" y1="15.75" x2="20" y2="15.75" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="15.75" y1="1" x2="15.75" y2="11" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="15.75" y1="20" x2="15.75" y2="29" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  energy: ({ className }) => (
    <svg viewBox="0 0 18 28" fill="none" className={className}>
      <path d="M10 1L1 16H9L8 27L17 12H9L10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  video: ({ className }) => (
    <svg viewBox="0 0 28 20" fill="none" className={className}>
      <rect x="1" y="1" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M19 7L27 3V17L19 13V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  star: ({ className }) => (
    <svg viewBox="0 0 24 23" fill="none" className={className}>
      <path d="M12 1L14.9 8.5L23 9.3L17 14.8L18.8 22.7L12 18.5L5.2 22.7L7 14.8L1 9.3L9.1 8.5L12 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  utilities: ({ className }) => (
    <svg viewBox="0 0 30 30" fill="none" className={className}>
      <circle cx="15" cy="15" r="14.25" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 5V15L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  dropdown: ({ className }) => (
    <svg viewBox="0 0 12 8" fill="none" className={className}>
      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  swipe: ({ className }) => (
    <svg viewBox="0 0 40 24" fill="none" className={className}>
      <path d="M8 12H32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 6L6 12L12 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28 6L34 12L28 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export function Icon({ name, size = 24, className }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <span
      className={cn('inline-block shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <IconComponent className="h-full w-full" />
    </span>
  )
}

// Convenience components for commonly used icons
export function BedroomsIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="bedrooms" size={size} className={className} />
}

export function BathroomIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="bathroom" size={size} className={className} />
}

export function PropertySizeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="property-size" size={size} className={className} />
}

export function SearchIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="search" size={size} className={className} />
}

export function FilterIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="filter" size={size} className={className} />
}

export function ShareIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="share" size={size} className={className} />
}

export function ExpandIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="expand" size={size} className={className} />
}

export function FacebookIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="facebook" size={size} className={className} />
}

export function InstagramIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="instagram" size={size} className={className} />
}

export function TikTokIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="tiktok" size={size} className={className} />
}

export function MapPinIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="map-pin" size={size} className={className} />
}

export function FloorplanIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="floorplan" size={size} className={className} />
}

export function EnergyIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="energy" size={size} className={className} />
}

export function VideoIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="video" size={size} className={className} />
}

export function StarIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="star" size={size} className={className} />
}

export function PropertyTypeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="property-type" size={size} className={className} />
}

export function UtilitiesIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="utilities" size={size} className={className} />
}

export function DropdownIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="dropdown" size={size} className={className} />
}

export function SwipeIcon({ size = 24, className }: Omit<IconProps, 'name'>) {
  return <Icon name="swipe" size={size} className={className} />
}
