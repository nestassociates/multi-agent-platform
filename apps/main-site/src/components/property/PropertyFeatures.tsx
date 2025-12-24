import { Check } from 'lucide-react'

interface PropertyFeaturesProps {
  features: string[]
}

export function PropertyFeatures({ features }: PropertyFeaturesProps) {
  if (!features?.length) return null

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">Features</h3>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
