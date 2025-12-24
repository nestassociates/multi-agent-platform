import Image from 'next/image'
import Link from 'next/link'
import { Phone, Mail, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Agent } from '@/lib/api/types'

interface PropertyAgentCardProps {
  agent: Agent
  propertyId?: string
}

export function PropertyAgentCard({ agent, propertyId }: PropertyAgentCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {agent.avatar_url ? (
            <Image
              src={agent.avatar_url}
              alt={agent.name}
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{agent.name}</h3>
            <p className="text-sm text-muted-foreground">Property Expert</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="mr-2 h-4 w-4" />
              {agent.phone}
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <Mail className="mr-2 h-4 w-4" />
            {agent.email}
          </a>
        </div>

        <div className="mt-6 space-y-2">
          <Button asChild className="w-full">
            <Link
              href={`/agent/${agent.id}${propertyId ? `?property=${propertyId}` : ''}`}
            >
              Contact {agent.name.split(' ')[0]}
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href={`/agent/${agent.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
