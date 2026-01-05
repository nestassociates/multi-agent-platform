'use client'

import { useState, useRef, useEffect } from 'react'
import { Link2, Twitter, MessageCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface ShareDropdownProps {
  url: string
  title: string
}

export function ShareDropdown({ url, title }: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLinks = [
    {
      label: 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopyLink,
      useLucide: true,
    },
    {
      label: 'Facebook',
      iconName: 'facebook' as const,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      useLucide: false,
    },
    {
      label: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      useLucide: true,
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      useLucide: true,
    },
  ]

  return (
    <div ref={dropdownRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share property"
        className="text-nest-brown hover:text-nest-olive"
      >
        <Icon name="share" size={20} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-nest-gray bg-white py-2 shadow-lg">
          {shareLinks.map((link) => {
            const LucideIcon = link.icon
            const content = (
              <>
                {link.useLucide && LucideIcon ? (
                  <LucideIcon className={`h-4 w-4 ${copied && link.label === 'Copy Link' ? 'text-nest-olive' : ''}`} />
                ) : (
                  <Icon name={link.iconName!} size={16} />
                )}
                <span>{copied && link.label === 'Copy Link' ? 'Copied!' : link.label}</span>
              </>
            )

            if (link.onClick) {
              return (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-nest-brown hover:bg-nest-gray/50"
                >
                  {content}
                </button>
              )
            }

            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-sm text-nest-brown hover:bg-nest-gray/50"
                onClick={() => setIsOpen(false)}
              >
                {content}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
