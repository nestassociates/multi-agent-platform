import { Home, BedDouble, Bath, Maximize2, FileText } from 'lucide-react'

interface PropertyStatsProps {
  propertyType: string | null
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number | null
  tenure: string | null
}

const statIcons = {
  propertyType: Home,
  bedrooms: BedDouble,
  bathrooms: Bath,
  size: Maximize2,
  tenure: FileText,
}

export function PropertyStats({
  propertyType,
  bedrooms,
  bathrooms,
  sizeSqft,
  tenure,
}: PropertyStatsProps) {
  const stats = [
    {
      label: 'Property Type',
      value: propertyType || 'N/A',
      icon: statIcons.propertyType,
    },
    {
      label: 'Bedrooms',
      value: bedrooms?.toString() || 'N/A',
      icon: statIcons.bedrooms,
    },
    {
      label: 'Bathrooms',
      value: bathrooms?.toString() || 'N/A',
      icon: statIcons.bathrooms,
    },
    {
      label: 'Size',
      value: sizeSqft ? `${sizeSqft.toLocaleString()} ft²` : 'N/A',
      icon: statIcons.size,
    },
    {
      label: 'Tenure',
      value: tenure || 'Freehold',
      icon: statIcons.tenure,
    },
  ]

  return (
    <div className="grid w-full grid-cols-3 border-t border-nest-gray py-6 md:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className={`flex flex-col items-center ${
              index >= 3 ? 'hidden md:flex' : ''
            }`}
          >
            <p className="text-[10px] uppercase tracking-nest text-nest-brown md:text-xs">
              {stat.label}
            </p>
            <div className="mt-2 inline-flex items-center justify-center gap-2">
              <Icon className="h-4 w-4 text-black md:h-5 md:w-5" strokeWidth={1.5} />
              <p className="text-xs font-medium uppercase text-black md:text-sm">
                {stat.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
