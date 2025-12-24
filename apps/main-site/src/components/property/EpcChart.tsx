'use client'

/**
 * EPC Chart Component
 * Generates UK-standard Energy Performance Certificate charts
 * based on efficiency ratings (0-100) and bands (A-G)
 */

interface EpcChartProps {
  currentEfficiency: number
  potentialEfficiency?: number | null
  type?: 'energy' | 'environmental'
  className?: string
}

// EPC band configuration (UK standard)
const bands = [
  { letter: 'A', min: 92, max: 100, color: '#008054' },  // Dark green
  { letter: 'B', min: 81, max: 91, color: '#19b459' },   // Green
  { letter: 'C', min: 69, max: 80, color: '#8dce46' },   // Light green
  { letter: 'D', min: 55, max: 68, color: '#ffd500' },   // Yellow
  { letter: 'E', min: 39, max: 54, color: '#fcaa65' },   // Orange
  { letter: 'F', min: 21, max: 38, color: '#ef8023' },   // Dark orange
  { letter: 'G', min: 1, max: 20, color: '#e9153b' },    // Red
]

function getBandForEfficiency(efficiency: number): typeof bands[0] | undefined {
  return bands.find(b => efficiency >= b.min && efficiency <= b.max)
}

function getRatingLetter(efficiency: number): string {
  const band = getBandForEfficiency(efficiency)
  return band?.letter || 'G'
}

export function EpcChart({
  currentEfficiency,
  potentialEfficiency,
  type = 'energy',
  className = '',
}: EpcChartProps) {
  const title = type === 'energy'
    ? 'Energy Efficiency Rating'
    : 'Environmental Impact Rating'

  const currentBand = getBandForEfficiency(currentEfficiency)
  const potentialBand = potentialEfficiency ? getBandForEfficiency(potentialEfficiency) : null

  // Calculate vertical position for rating indicators
  const bandHeight = 28
  const bandGap = 4
  const startY = 45

  const getYPositionForEfficiency = (efficiency: number) => {
    const bandIndex = bands.findIndex(b => efficiency >= b.min && efficiency <= b.max)
    if (bandIndex === -1) return startY + (bands.length - 1) * (bandHeight + bandGap) + bandHeight / 2
    return startY + bandIndex * (bandHeight + bandGap) + bandHeight / 2
  }

  const currentY = getYPositionForEfficiency(currentEfficiency)
  const potentialY = potentialEfficiency ? getYPositionForEfficiency(potentialEfficiency) : null

  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-nest-brown">
        {title}
      </p>
      <svg
        viewBox="0 0 300 280"
        className="w-full max-w-[300px]"
        role="img"
        aria-label={`${title}: Current ${getRatingLetter(currentEfficiency)} (${currentEfficiency})${potentialEfficiency ? `, Potential ${getRatingLetter(potentialEfficiency)} (${potentialEfficiency})` : ''}`}
      >
        {/* Title */}
        <text x="10" y="25" className="fill-current text-[11px] font-medium">
          {type === 'energy' ? 'Energy rating' : 'Environmental rating'}
        </text>

        {/* Column headers */}
        <text x="200" y="25" textAnchor="middle" className="fill-current text-[10px]">
          Current
        </text>
        {potentialEfficiency && (
          <text x="260" y="25" textAnchor="middle" className="fill-current text-[10px]">
            Potential
          </text>
        )}

        {/* Rating bands */}
        {bands.map((band, index) => {
          const y = startY + index * (bandHeight + bandGap)
          const width = 150 - index * 12 // Bands get narrower as they go down

          return (
            <g key={band.letter}>
              {/* Band rectangle */}
              <rect
                x="10"
                y={y}
                width={width}
                height={bandHeight}
                fill={band.color}
                rx="2"
              />
              {/* Band letter */}
              <text
                x="20"
                y={y + bandHeight / 2 + 5}
                className="fill-white text-[14px] font-bold"
              >
                {band.letter}
              </text>
              {/* Band range */}
              <text
                x={width - 5}
                y={y + bandHeight / 2 + 4}
                textAnchor="end"
                className="fill-white text-[10px]"
              >
                {band.min}-{band.max}
              </text>
            </g>
          )
        })}

        {/* Current rating indicator */}
        {currentBand && (
          <g>
            {/* Arrow pointing left */}
            <polygon
              points={`175,${currentY - 12} 175,${currentY + 12} 185,${currentY + 12} 185,${currentY + 6} 195,${currentY} 185,${currentY - 6} 185,${currentY - 12}`}
              fill={currentBand.color}
            />
            {/* Rating box */}
            <rect
              x="195"
              y={currentY - 14}
              width="40"
              height="28"
              fill={currentBand.color}
              rx="2"
            />
            {/* Rating letter and number */}
            <text
              x="215"
              y={currentY + 1}
              textAnchor="middle"
              className="fill-white text-[11px] font-bold"
            >
              {currentBand.letter}
            </text>
            <text
              x="215"
              y={currentY + 11}
              textAnchor="middle"
              className="fill-white text-[9px]"
            >
              {currentEfficiency}
            </text>
          </g>
        )}

        {/* Potential rating indicator */}
        {potentialBand && potentialY && (
          <g>
            {/* Arrow pointing left */}
            <polygon
              points={`240,${potentialY - 12} 240,${potentialY + 12} 250,${potentialY + 12} 250,${potentialY + 6} 260,${potentialY} 250,${potentialY - 6} 250,${potentialY - 12}`}
              fill={potentialBand.color}
            />
            {/* Rating box */}
            <rect
              x="260"
              y={potentialY - 14}
              width="35"
              height="28"
              fill={potentialBand.color}
              rx="2"
            />
            {/* Rating letter and number */}
            <text
              x="277"
              y={potentialY + 1}
              textAnchor="middle"
              className="fill-white text-[11px] font-bold"
            >
              {potentialBand.letter}
            </text>
            <text
              x="277"
              y={potentialY + 11}
              textAnchor="middle"
              className="fill-white text-[9px]"
            >
              {potentialEfficiency}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Combined EPC Display with both Energy and Environmental charts
 */
interface EpcDisplayProps {
  currentEfficiency: number | null
  potentialEfficiency: number | null
  currentEnvironmental: number | null
  potentialEnvironmental: number | null
}

export function EpcDisplay({
  currentEfficiency,
  potentialEfficiency,
  currentEnvironmental,
  potentialEnvironmental,
}: EpcDisplayProps) {
  const hasEnergy = currentEfficiency !== null && currentEfficiency > 0
  const hasEnvironmental = currentEnvironmental !== null && currentEnvironmental > 0

  if (!hasEnergy && !hasEnvironmental) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {hasEnergy && (
        <EpcChart
          currentEfficiency={currentEfficiency!}
          potentialEfficiency={potentialEfficiency}
          type="energy"
        />
      )}
      {hasEnvironmental && (
        <EpcChart
          currentEfficiency={currentEnvironmental!}
          potentialEfficiency={potentialEnvironmental}
          type="environmental"
        />
      )}
    </div>
  )
}
