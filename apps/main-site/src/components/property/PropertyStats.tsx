import { FileText } from 'lucide-react'
import { Icon, type IconName } from '@/components/ui/icon'

interface PropertyStatsProps {
  propertyType: string | null
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number | null
  tenure: string | null
}

interface StatItem {
  label: string
  value: string
  iconName?: IconName
  useLucide?: boolean
}

export function PropertyStats({
  propertyType,
  bedrooms,
  bathrooms,
  sizeSqft,
  tenure,
}: PropertyStatsProps) {
  const stats: StatItem[] = [
    {
      label: 'Property Type',
      value: propertyType || 'N/A',
      iconName: 'property-type',
    },
    {
      label: 'Bedrooms',
      value: bedrooms?.toString() || 'N/A',
      iconName: 'bedrooms',
    },
    {
      label: 'Bathrooms',
      value: bathrooms?.toString() || 'N/A',
      iconName: 'bathroom',
    },
    {
      label: 'Size',
      value: sizeSqft ? `${sizeSqft.toLocaleString()} ft²` : 'N/A',
      iconName: 'property-size',
    },
    {
      label: 'Tenure',
      value: tenure || 'Freehold',
      useLucide: true,
    },
  ]

  return (
    <div className="grid w-full grid-cols-3 border-t border-nest-gray py-6 md:grid-cols-5">
      {stats.map((stat, index) => (
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
            {stat.useLucide ? (
              <FileText className="h-4 w-4 text-black md:h-5 md:w-5" strokeWidth={1.5} />
            ) : (
              <Icon name={stat.iconName!} size={20} className="h-4 w-4 md:h-5 md:w-5" />
            )}
            <p className="text-xs font-medium uppercase text-black md:text-sm">
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
