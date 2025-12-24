'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'BUY', href: '/buy' },
  { name: 'SELL', href: '/sell' },
  { name: 'RENT', href: '/rent' },
  { name: 'LANDLORDS', href: '/landlords' },
  { name: 'AGENTS', href: '/agents' },
  { name: 'JOURNAL', href: '/journal' },
  { name: 'JOIN US', href: '/join' },
  { name: 'ABOUT', href: '/about' },
  { name: 'CONTACT', href: '/contact' },
]

interface HamburgerIconProps {
  open: boolean
  transparent?: boolean
}

function HamburgerIcon({ open, transparent }: HamburgerIconProps) {
  const barColor = transparent && !open ? 'bg-white' : 'bg-black'

  return (
    <div className="flex h-6 w-8 flex-col justify-center gap-[5px]">
      {/* Top line */}
      <span
        className={cn(
          'h-[2px] w-full transition-all duration-300',
          barColor,
          open && 'translate-y-[7px] rotate-45'
        )}
      />
      {/* Middle line */}
      <span
        className={cn(
          'h-[2px] w-full transition-all duration-300',
          barColor,
          open && 'opacity-0'
        )}
      />
      {/* Bottom line */}
      <span
        className={cn(
          'h-[2px] w-full transition-all duration-300',
          barColor,
          open && '-translate-y-[7px] -rotate-45'
        )}
      />
    </div>
  )
}

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent: transparentProp }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Auto-detect homepage for transparent header
  const transparent = transparentProp ?? pathname === '/'

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const logoSrc = transparent && !mobileMenuOpen ? '/images/nest-logo-white.svg' : '/images/nest-logo.svg'
  const textColor = transparent && !mobileMenuOpen ? 'text-white' : 'text-black'

  return (
    <header
      className={cn(
        'relative z-50 w-full',
        transparent ? 'absolute top-0 left-0 right-0 bg-transparent' : 'bg-nest-pink'
      )}
    >
      {/* Mobile Header */}
      <nav
        className={cn(
          'relative z-50 flex h-[80px] items-center justify-between px-6 lg:hidden',
          mobileMenuOpen && 'bg-nest-pink'
        )}
      >
        {/* Logo on left */}
        <Link href="/" className="flex items-center">
          <Image
            src={logoSrc}
            alt="Nest Associates"
            width={100}
            height={58}
            className="h-[58px] w-auto"
            priority
          />
        </Link>

        {/* Hamburger Menu - morphs into X when open */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <HamburgerIcon open={mobileMenuOpen} transparent={transparent} />
        </button>
      </nav>

      {/* Desktop Header */}
      <nav className="container-wide hidden h-[100px] items-center justify-between lg:flex">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={logoSrc}
            alt="Nest Associates"
            width={126}
            height={73}
            className="h-[73px] w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="flex items-end gap-6 self-end pb-5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-[15px] font-normal uppercase tracking-[0.5px] transition-opacity hover:opacity-70',
                textColor
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Menu - Clipping container at header bottom */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[80px] bottom-0 z-40 overflow-hidden lg:hidden">
          {/* Inner content that slides down */}
          <div className="h-full bg-nest-pink animate-menu-open">
            {/* Navigation Links */}
            <div className="flex h-full flex-col justify-between px-6 pb-12 pt-8">
              <nav className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block text-[22px] font-normal uppercase tracking-[3px] text-black hover:opacity-70"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Divider and Social Icons */}
              <div>
                <div className="mb-8 h-[2px] w-full max-w-[400px] bg-black/30" />
                <div className="flex gap-3">
                  {/* TikTok */}
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="hover:opacity-70"
                  >
                    <svg className="h-10 w-10" viewBox="0 0 448 512" fill="currentColor">
                      <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/>
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="hover:opacity-70"
                  >
                    <svg className="h-10 w-10" viewBox="0 0 448 512" fill="currentColor">
                      <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                    </svg>
                  </a>
                  {/* Facebook Square */}
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="hover:opacity-70"
                  >
                    <svg className="h-10 w-10" viewBox="0 0 448 512" fill="currentColor">
                      <path d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.3V327.7h-63V256h63v-54.6c0-62.2 37-96.5 93.7-96.5 27.1 0 55.5 4.8 55.5 4.8v61h-31.3c-30.8 0-40.4 19.1-40.4 38.7V256h68.8l-11 71.7h-57.8V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0 -48-48z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
