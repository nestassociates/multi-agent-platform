'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Splide, SplideSlide, SplideTrack, SplideInstance } from '@splidejs/react-splide'
import '@splidejs/splide/css'

interface Agent {
  id: string
  name: string
  first_name: string
  last_name: string
  territory: string | null
  avatar_url: string | null
  microsite_url: string
  subdomain: string
}

interface AgentCarouselProps {
  agents: Agent[]
}

// Card dimensions - Desktop
const ACTIVE_CARD_WIDTH = 350
const ACTIVE_CARD_HEIGHT = 450
const INACTIVE_CARD_WIDTH = 207
const INACTIVE_CARD_HEIGHT = 280
const CARD_GAP = 25

// Card dimensions - Mobile (< 768px)
const MOBILE_ACTIVE_CARD_WIDTH = 228
const MOBILE_ACTIVE_CARD_HEIGHT = 293
const MOBILE_INACTIVE_CARD_WIDTH = 140
const MOBILE_INACTIVE_CARD_HEIGHT = 182
const MOBILE_CARD_GAP = 15

export function AgentCarousel({ agents }: AgentCarouselProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const splideRef = useRef<SplideInstance | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Continuously track which slide is in the center and update DOM directly
  // (Direct DOM manipulation needed because Splide clones aren't React-managed)
  useEffect(() => {
    if (agents.length === 0) return

    let rafId: number
    let currentCenterIndex = -1

    const updateCenterSlide = () => {
      if (!containerRef.current) {
        rafId = requestAnimationFrame(updateCenterSlide)
        return
      }

      const slides = containerRef.current.querySelectorAll('.splide__slide')
      if (slides.length === 0) {
        rafId = requestAnimationFrame(updateCenterSlide)
        return
      }

      const viewportCenter = window.innerWidth / 2

      let closestIndex = 0
      let closestDistance = Infinity
      let currentDistance = Infinity

      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect()
        const slideCenter = rect.left + rect.width / 2
        const distance = Math.abs(viewportCenter - slideCenter)
        const slideIndex = parseInt(slide.getAttribute('data-index') || '0', 10)

        // Track CLOSEST instance of current center slide (there may be clones)
        if (slideIndex === currentCenterIndex && distance < currentDistance) {
          currentDistance = distance
        }

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = slideIndex
        }
      })

      // Only change center if new slide is significantly closer (hysteresis)
      const THRESHOLD = 30
      const shouldChange =
        (closestIndex !== currentCenterIndex && closestDistance < currentDistance - THRESHOLD) ||
        (closestIndex !== currentCenterIndex && currentDistance === Infinity)

      if (shouldChange) {
        currentCenterIndex = closestIndex

        // Update ALL slides directly in the DOM (including Splide clones)
        slides.forEach((slide) => {
          const slideIndex = parseInt(slide.getAttribute('data-index') || '0', 10)
          const isCenter = slideIndex === closestIndex

          // Toggle data attribute for CSS styling
          slide.setAttribute('data-center', isCenter ? 'true' : 'false')
        })
      }

      rafId = requestAnimationFrame(updateCenterSlide)
    }

    rafId = requestAnimationFrame(updateCenterSlide)

    return () => cancelAnimationFrame(rafId)
  }, [agents.length])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Find agent matching search and go to that slide
    if (!searchQuery.trim() || !splideRef.current) return

    const query = searchQuery.toLowerCase()
    const index = agents.findIndex(agent =>
      agent.territory?.toLowerCase().includes(query) ||
      agent.name.toLowerCase().includes(query)
    )
    if (index !== -1) {
      splideRef.current.go(index)
    }
  }

  const handleAgentClick = (agent: Agent) => {
    window.open(agent.microsite_url, '_blank')
  }

  // Don't render if no agents
  if (agents.length === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden bg-nest-pink">
      {/* Styles for center card detection (applied via data attribute to handle Splide clones) */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Mobile styles (default) */
        .agent-slide {
          width: ${MOBILE_INACTIVE_CARD_WIDTH}px !important;
        }
        .agent-slide .slide-container {
          padding-top: ${(MOBILE_ACTIVE_CARD_HEIGHT - MOBILE_INACTIVE_CARD_HEIGHT) / 2 + 15}px;
          width: ${MOBILE_INACTIVE_CARD_WIDTH}px;
          height: ${MOBILE_ACTIVE_CARD_HEIGHT + 60}px;
        }
        .agent-slide .card {
          width: ${MOBILE_INACTIVE_CARD_WIDTH}px;
          height: ${MOBILE_INACTIVE_CARD_HEIGHT}px;
        }
        .agent-slide .photo {
          height: ${MOBILE_INACTIVE_CARD_HEIGHT - 45}px;
        }
        .agent-slide .initials {
          font-size: 1.25rem;
        }
        .agent-slide .name,
        .agent-slide .territory {
          font-size: 8px;
        }

        /* Active/center card styles - Mobile */
        .agent-slide[data-center="true"] .slide-container {
          padding-top: 15px;
        }
        .agent-slide[data-center="true"] .card {
          width: ${MOBILE_ACTIVE_CARD_WIDTH}px;
          height: ${MOBILE_ACTIVE_CARD_HEIGHT}px;
          z-index: 20;
          filter: grayscale(0);
        }
        .agent-slide[data-center="true"] .photo {
          height: ${MOBILE_ACTIVE_CARD_HEIGHT - 55}px;
        }
        .agent-slide[data-center="true"] .initials {
          font-size: 1.75rem;
        }
        .agent-slide[data-center="true"] .info {
          margin-top: 0.5rem;
        }
        .agent-slide[data-center="true"] .name,
        .agent-slide[data-center="true"] .territory {
          font-size: 11px;
        }

        /* Desktop styles (768px and up) */
        @media (min-width: 768px) {
          .agent-slide {
            width: ${INACTIVE_CARD_WIDTH}px !important;
          }
          .agent-slide .slide-container {
            padding-top: ${(ACTIVE_CARD_HEIGHT - INACTIVE_CARD_HEIGHT) / 2 + 20}px;
            width: ${INACTIVE_CARD_WIDTH}px;
            height: ${ACTIVE_CARD_HEIGHT + 70}px;
          }
          .agent-slide .card {
            width: ${INACTIVE_CARD_WIDTH}px;
            height: ${INACTIVE_CARD_HEIGHT}px;
          }
          .agent-slide .photo {
            height: ${INACTIVE_CARD_HEIGHT - 60}px;
          }
          .agent-slide .initials {
            font-size: 1.5rem;
          }
          .agent-slide .name,
          .agent-slide .territory {
            font-size: 10px;
          }

          /* Active/center card styles - Desktop */
          .agent-slide[data-center="true"] .slide-container {
            padding-top: 20px;
          }
          .agent-slide[data-center="true"] .card {
            width: ${ACTIVE_CARD_WIDTH}px;
            height: ${ACTIVE_CARD_HEIGHT}px;
          }
          .agent-slide[data-center="true"] .photo {
            height: ${ACTIVE_CARD_HEIGHT - 80}px;
          }
          .agent-slide[data-center="true"] .initials {
            font-size: 2.25rem;
          }
          .agent-slide[data-center="true"] .info {
            margin-top: 0.75rem;
          }
          .agent-slide[data-center="true"] .name,
          .agent-slide[data-center="true"] .territory {
            font-size: 14px;
          }
        }
      `}} />
      {/* Side gradients - subtle darkening vignette on left and right edges (behind cards, desktop only) */}
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-[150px] z-0 hidden lg:block"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-[150px] z-0 hidden lg:block"
        style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.2), transparent)' }}
      />

      {/* Leaf decoration - right side (above gradient, behind cards) */}
      {/* Desktop plant */}
      <div className="pointer-events-none absolute -right-10 top-0 bottom-0 z-[5] w-[400px] hidden lg:block">
        <Image
          src="/images/home/homepage-agent-plant.webp"
          alt=""
          fill
          className="object-contain object-right-bottom"
        />
      </div>
      {/* Mobile plant */}
      <div className="pointer-events-none absolute -right-5 top-0 bottom-0 z-[5] w-[250px] lg:hidden">
        <Image
          src="/images/home/mobile-agent-plant.webp"
          alt=""
          fill
          className="object-contain object-right-bottom"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-28 pb-28">
        {/* Heading */}
        <h2 className="mb-8 px-4 lg:px-0 text-center text-[24px] lg:text-[32px] font-normal uppercase tracking-[2px] text-nest-brown">
          Find Your Local Property Expert
        </h2>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mx-4 lg:mx-auto mb-16 flex max-w-sm border-2 border-nest-brown bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ENTER LOCATION"
            className="flex-1 bg-transparent px-6 py-3 text-[14px] font-medium uppercase tracking-[0.1em] text-nest-brown placeholder:text-nest-brown/50 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-nest-brown px-5 flex items-center justify-center hover:bg-nest-brown/90 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-white" />
          </button>
        </form>

        {/* Splide Carousel */}
        <div ref={containerRef}>
          <Splide
              ref={splideRef}
              hasTrack={false}
              options={{
                type: 'loop',
                focus: 'center',
                autoWidth: true,
                gap: CARD_GAP,
                pagination: false,
                arrows: false,
                drag: 'free',
                snap: true,
                flickPower: 300,
                mediaQuery: 'min',
                breakpoints: {
                  768: {
                    gap: CARD_GAP,
                  },
                  0: {
                    gap: MOBILE_CARD_GAP,
                  },
                },
              }}
              aria-label="Property Agents"
            >
              <SplideTrack>
                {agents.map((agent, index) => (
                  <SplideSlide key={agent.id} data-index={index} className="agent-slide">
                    <div className="slide-container relative flex justify-center">
                      <button
                        onClick={() => handleAgentClick(agent)}
                        className="card absolute bg-white p-3 z-10 grayscale transition-[width,height,filter] duration-150 ease-out"
                        style={{
                          boxShadow: '0 15px 15px rgba(0, 0, 0, 0.25)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {/* Photo */}
                        <div className="photo relative w-full overflow-hidden bg-nest-gray">
                          {agent.avatar_url ? (
                            <Image
                              src={agent.avatar_url}
                              alt={agent.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="initials flex h-full w-full items-center justify-center text-nest-brown/40">
                              {agent.first_name?.[0]}{agent.last_name?.[0]}
                            </div>
                          )}
                        </div>

                        {/* Name and Location - below image */}
                        <div className="info text-left mt-2">
                          <p className="name font-normal uppercase tracking-wider text-nest-brown">
                            {agent.name}
                          </p>
                          {agent.territory && (
                            <p className="territory font-bold uppercase tracking-wider text-nest-brown">
                              {agent.territory}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  </SplideSlide>
                ))}
            </SplideTrack>
          </Splide>
        </div>
      </div>
    </section>
  )
}
