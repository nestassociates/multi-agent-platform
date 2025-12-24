'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PropertyDescriptionProps {
  description?: string | null
  features?: string[]
}

const COLLAPSED_HEIGHT = 150 // pixels

export function PropertyDescription({ description, features }: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowToggle, setShouldShowToggle] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      setShouldShowToggle(contentRef.current.scrollHeight > COLLAPSED_HEIGHT)
    }
  }, [description])

  if (!description && (!features || features.length === 0)) {
    return null
  }

  return (
    <div className="mt-8 pt-8">
      <h2 className="text-lg font-medium uppercase tracking-nest text-black">
        About the Property
      </h2>

      {/* Key Features */}
      {features && features.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium uppercase tracking-nest text-black">
            Key Features
          </h3>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-nest-brown">
                <span className="text-nest-olive">-</span>
                <span className="uppercase tracking-wide">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="mt-6">
          <div
            ref={contentRef}
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              !isExpanded && shouldShowToggle ? 'max-h-[150px]' : 'max-h-[2000px]'
            }`}
            style={{
              maskImage: !isExpanded && shouldShowToggle
                ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
                : 'none',
              WebkitMaskImage: !isExpanded && shouldShowToggle
                ? 'linear-gradient(to bottom, black 60%, transparent 100%)'
                : 'none',
            }}
          >
            <div
              className="prose prose-sm max-w-none whitespace-pre-line text-nest-brown prose-p:mb-4 prose-p:leading-relaxed [&>br]:block [&>br]:mb-4"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {shouldShowToggle && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center gap-1 text-sm font-medium uppercase tracking-nest text-black underline hover:text-nest-olive transition-colors"
            >
              {isExpanded ? (
                <>
                  Read Less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Read More
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
