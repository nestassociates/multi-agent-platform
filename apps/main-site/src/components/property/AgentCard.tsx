import Image from 'next/image'
import Link from 'next/link'
import { Phone, Facebook, Instagram, Linkedin, Twitter, User } from 'lucide-react'
import type { Agent } from '@/lib/api/types'

interface AgentCardProps {
  agent: Agent
  variant?: 'sidebar' | 'inline'
}

export function AgentCard({ agent, variant = 'sidebar' }: AgentCardProps) {
  const isSidebar = variant === 'sidebar'
  const socialMedia = agent.social_media

  return (
    <div
      className={
        isSidebar
          ? 'border border-nest-gray p-6'
          : 'flex items-center justify-between'
      }
    >
      <div className={isSidebar ? 'text-center' : 'flex items-center gap-4'}>
        {/* Avatar */}
        {agent.avatar_url ? (
          <div className={isSidebar ? 'flex justify-center' : ''}>
            <Image
              src={agent.avatar_url}
              alt={agent.name}
              width={isSidebar ? 80 : 48}
              height={isSidebar ? 80 : 48}
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center rounded-full bg-nest-gray ${
              isSidebar ? 'mx-auto h-20 w-20' : 'h-12 w-12'
            }`}
          >
            <User className={isSidebar ? 'h-8 w-8' : 'h-6 w-6'} />
          </div>
        )}

        {/* Name and Phone */}
        <div className={isSidebar ? 'mt-4' : ''}>
          <p className="font-medium uppercase tracking-nest text-black">
            {agent.name}
          </p>
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className={`flex items-center gap-1 text-sm text-nest-brown hover:text-nest-olive ${
                isSidebar ? 'mt-1 justify-center' : ''
              }`}
            >
              <Phone className="h-3 w-3" />
              {agent.phone}
            </a>
          )}
        </div>
      </div>

      {/* Social Media Links */}
      <div
        className={`flex gap-3 text-nest-brown ${
          isSidebar ? 'mt-4 justify-center' : ''
        }`}
      >
        {socialMedia?.facebook && (
          <SocialLink href={socialMedia.facebook} label="Facebook">
            <Facebook className="h-5 w-5" />
          </SocialLink>
        )}
        {socialMedia?.instagram && (
          <SocialLink href={socialMedia.instagram} label="Instagram">
            <Instagram className="h-5 w-5" />
          </SocialLink>
        )}
        {socialMedia?.twitter && (
          <SocialLink href={socialMedia.twitter} label="Twitter">
            <Twitter className="h-5 w-5" />
          </SocialLink>
        )}
        {socialMedia?.linkedin && (
          <SocialLink href={socialMedia.linkedin} label="LinkedIn">
            <Linkedin className="h-5 w-5" />
          </SocialLink>
        )}
        {/* Fallback icons if no social media data */}
        {!socialMedia && (
          <>
            <span className="hover:text-nest-olive">
              <Facebook className="h-5 w-5" />
            </span>
            <span className="hover:text-nest-olive">
              <Instagram className="h-5 w-5" />
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="hover:text-nest-olive"
    >
      {children}
    </Link>
  )
}
