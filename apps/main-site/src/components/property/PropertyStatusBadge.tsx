import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Property } from '@/lib/api/types'

interface PropertyStatusBadgeProps {
  status: Property['status']
  className?: string
}

const statusConfig: Record<
  Property['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }
> = {
  available: { label: 'Available', variant: 'success' },
  under_offer: { label: 'Under Offer', variant: 'warning' },
  sold: { label: 'Sold', variant: 'destructive' },
  let: { label: 'Let', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'secondary' },
}

export function PropertyStatusBadge({
  status,
  className,
}: PropertyStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}
