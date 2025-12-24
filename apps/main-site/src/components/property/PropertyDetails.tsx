interface PropertyDetailsProps {
  councilTaxBand: string | null
  parking: string | null
  garden: string | null
  accessibility: string | null
}

export function PropertyDetails({
  councilTaxBand,
  parking,
  garden,
  accessibility,
}: PropertyDetailsProps) {
  const details = [
    {
      label: 'Council Tax',
      value: councilTaxBand || 'Ask Agent',
    },
    {
      label: 'Parking',
      value: parking || 'Ask Agent',
    },
    {
      label: 'Garden',
      value: garden || 'Ask Agent',
    },
    {
      label: 'Accessibility',
      value: accessibility || 'Ask Agent',
    },
  ]

  return (
    <div className="mt-8 border-y border-nest-gray py-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {details.map((detail) => (
          <div key={detail.label}>
            <p className="text-[10px] uppercase tracking-nest text-nest-brown md:text-xs">
              {detail.label}
            </p>
            <p className="mt-2 text-sm font-medium uppercase text-black">
              {detail.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
