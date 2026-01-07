'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { cn } from '@/lib/utils'

export interface LocationSuggestion {
  type: 'postcode' | 'place'
  label: string
  value: string
  lat: number
  lng: number
}

export interface LocationSearchProps {
  value: string
  onChange: (value: string, coords?: { lat: number; lng: number }) => void
  placeholder?: string
  placeholderMobile?: string
  className?: string
  inputClassName?: string
  variant?: 'dark' | 'light'
}

// Postcode icon
function PostcodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 6H15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 11H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Location pin icon
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1C5.23858 1 3 3.23858 3 6C3 9.5 8 15 8 15C8 15 13 9.5 13 6C13 3.23858 10.7614 1 8 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

// Loader spinner
function Loader({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path
        d="M8 2C4.68629 2 2 4.68629 2 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const DASHBOARD_API_URL = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'http://localhost:3000'

export function LocationSearch({
  value,
  onChange,
  placeholder = 'Search by address, postcode, town, area. etc',
  placeholderMobile = 'Location',
  className,
  inputClassName,
  variant = 'light',
}: LocationSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([])
  const [loading, setLoading] = React.useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = React.useState(placeholder)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  const isDark = variant === 'dark'

  // Sync input value with external value
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle responsive placeholder
  React.useEffect(() => {
    const updatePlaceholder = () => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        setCurrentPlaceholder(placeholder)
      } else {
        setCurrentPlaceholder(placeholderMobile)
      }
    }

    updatePlaceholder()
    window.addEventListener('resize', updatePlaceholder)
    return () => window.removeEventListener('resize', updatePlaceholder)
  }, [placeholder, placeholderMobile])

  // Fetch suggestions with debounce
  const fetchSuggestions = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `${DASHBOARD_API_URL}/api/public/locations/suggestions?q=${encodeURIComponent(query)}&limit=10`
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)

    // Open popover if not already open
    if (!open && newValue.length >= 2) {
      setOpen(true)
    }
  }

  // Handle suggestion selection
  const handleSelect = (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.value)
    onChange(suggestion.value, { lat: suggestion.lat, lng: suggestion.lng })
    setOpen(false)
    setSuggestions([])
  }

  // Handle manual input (no suggestion selected)
  const handleBlur = () => {
    // Small delay to allow click events on suggestions
    setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue) // No coords - will need geocoding
      }
    }, 150)
  }

  // Handle Enter key to submit current value
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.defaultPrevented) {
      onChange(inputValue)
      setOpen(false)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className={cn('relative w-full', className)}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (inputValue.length >= 2) {
                setOpen(true)
                // Fetch suggestions for existing value if we don't have any
                if (suggestions.length === 0) {
                  fetchSuggestions(inputValue)
                }
              }
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            className={cn(
              'h-[50px] w-full border-0 px-4 text-[14px] focus:outline-none',
              isDark
                ? 'bg-transparent text-white placeholder:text-white/60'
                : 'bg-white text-black placeholder:text-black/60',
              inputClassName
            )}
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader className={isDark ? 'text-white/60' : 'text-black/60'} />
            </div>
          )}
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-none border bg-white shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
          sideOffset={0}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="w-full" shouldFilter={false}>
            <Command.List className="max-h-[300px] overflow-y-auto">
              {suggestions.length === 0 && !loading && inputValue.length >= 2 && (
                <Command.Empty className="px-4 py-3 text-[13px] text-black/60">
                  No locations found
                </Command.Empty>
              )}

              {suggestions.length > 0 && (
                <>
                  {/* Group postcodes */}
                  {suggestions.filter((s) => s.type === 'postcode').length > 0 && (
                    <Command.Group>
                      {suggestions
                        .filter((s) => s.type === 'postcode')
                        .map((suggestion) => (
                          <Command.Item
                            key={`postcode-${suggestion.value}`}
                            value={suggestion.value}
                            onSelect={() => handleSelect(suggestion)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelect(suggestion)
                            }}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-100 data-[selected]:bg-gray-200"
                          >
                            <PostcodeIcon className="h-4 w-4 shrink-0 text-black/40" />
                            <span className="flex-1 text-[14px] text-black">{suggestion.label}</span>
                            <span className="text-[11px] uppercase tracking-wider text-black/40">
                              Postcode
                            </span>
                          </Command.Item>
                        ))}
                    </Command.Group>
                  )}

                  {/* Divider if both types exist */}
                  {suggestions.filter((s) => s.type === 'postcode').length > 0 &&
                    suggestions.filter((s) => s.type === 'place').length > 0 && (
                      <div className="mx-4 border-t border-gray-100" />
                    )}

                  {/* Group places */}
                  {suggestions.filter((s) => s.type === 'place').length > 0 && (
                    <Command.Group>
                      {suggestions
                        .filter((s) => s.type === 'place')
                        .map((suggestion) => (
                          <Command.Item
                            key={`place-${suggestion.value}-${suggestion.lat}`}
                            value={`${suggestion.value}-${suggestion.lat}`}
                            onSelect={() => handleSelect(suggestion)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleSelect(suggestion)
                            }}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-100 data-[selected]:bg-gray-200"
                          >
                            <LocationIcon className="h-4 w-4 shrink-0 text-black/40" />
                            <span className="flex-1 text-[14px] text-black">{suggestion.label}</span>
                            <span className="text-[11px] uppercase tracking-wider text-black/40">
                              Place
                            </span>
                          </Command.Item>
                        ))}
                    </Command.Group>
                  )}
                </>
              )}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
