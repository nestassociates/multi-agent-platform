'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PropertySearch } from './PropertySearch'

// Hero background images
const heroImages = [
  '/images/hero/HomePage_header_01.jpg',
  '/images/hero/HomePage_header_02.jpg',
  '/images/hero/HomePage_header_03.jpg',
  '/images/hero/HomePage_header_04.jpg',
  '/images/hero/HomePage_header_05.jpg',
]

// Duration for each slide in milliseconds
const SLIDE_DURATION = 6000

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length)
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(goToNext, SLIDE_DURATION)
    return () => clearInterval(interval)
  }, [goToNext])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Ken Burns container - continuous slow zoom, images fade on top */}
      <div className="absolute inset-0 animate-ken-burns">
        {/* Background Images - only opacity changes */}
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
      </div>

      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content - centered */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* Headline */}
        <h1 className="text-left md:text-center text-[32px] font-normal uppercase tracking-[2px] leading-[38px] text-white md:text-[40px] md:leading-[46px] lg:text-[50px] lg:leading-[55px]">
          Where Your
          <br />
          Property Journey Begins
        </h1>

        {/* Search Component */}
        <div className="mt-10 w-full max-w-xl">
          <PropertySearch />
        </div>
      </div>

      {/* Slide indicators - horizontal lines */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
            }}
            className={cn(
              "h-[2px] transition-all duration-300",
              index === currentIndex ? "w-16 bg-white" : "w-10 bg-white/40"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
