'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PropertyImage } from '@/lib/api/types'

interface PropertyGalleryProps {
  images: PropertyImage[]
  title: string
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Touch swipe state
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const minSwipeDistance = 50 // Minimum distance to trigger swipe

  if (!images?.length) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') setLightboxOpen(false)
  }

  // Touch event handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    const distance = touchStartX.current - touchEndX.current
    const isSwipeLeft = distance > minSwipeDistance
    const isSwipeRight = distance < -minSwipeDistance

    if (isSwipeLeft && images.length > 1) {
      goToNext()
    } else if (isSwipeRight && images.length > 1) {
      goToPrevious()
    }
  }, [images.length])

  // Get thumbnail images (next 3 after current, wrapping around)
  const getThumbnailIndices = () => {
    const thumbs: number[] = []
    for (let i = 1; i <= 3 && i < images.length; i++) {
      const idx = (currentIndex + i) % images.length
      thumbs.push(idx)
    }
    return thumbs
  }

  const thumbnailIndices = getThumbnailIndices()

  // Get indices of images to preload (prev, next, and next+1)
  const getPreloadIndices = useCallback(() => {
    if (images.length <= 1) return []
    const indices = new Set<number>()
    // Previous
    indices.add((currentIndex - 1 + images.length) % images.length)
    // Next
    indices.add((currentIndex + 1) % images.length)
    // Next + 1 (for smoother scrolling)
    indices.add((currentIndex + 2) % images.length)
    // Remove current index
    indices.delete(currentIndex)
    return Array.from(indices)
  }, [currentIndex, images.length])

  const preloadIndices = getPreloadIndices()

  // Preload images using native browser preloading for faster response
  useEffect(() => {
    preloadIndices.forEach((idx) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = images[idx].url
      document.head.appendChild(link)
      // Clean up after a delay
      setTimeout(() => link.remove(), 10000)
    })
  }, [preloadIndices, images])

  return (
    <>
      {/* Bento Gallery Layout */}
      <div className="grid gap-2 lg:grid-cols-4 lg:grid-rows-1">
        {/* Main Image - spans 3 columns on lg+ */}
        <div
          className="group relative col-span-full aspect-[4/3] overflow-hidden bg-nest-gray lg:col-span-3 lg:row-span-1 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={images[currentIndex].url}
            alt={images[currentIndex].alt || `${title} - Image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 70vw"
          />

          {/* Navigation Arrows - visible on hover */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 bg-white/80 hover:bg-white"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 bg-white/80 hover:bg-white"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Expand Button - bottom right */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/80 hover:bg-white"
              onClick={() => setLightboxOpen(true)}
              aria-label="View fullscreen gallery"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Side Thumbnails - stacked vertically, desktop only */}
        {images.length > 1 && (
          <div className="hidden flex-col gap-2 lg:flex lg:row-span-1">
            {thumbnailIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'relative flex-1 w-full overflow-hidden bg-nest-gray transition-opacity hover:opacity-90',
                  currentIndex === idx && 'ring-2 ring-nest-olive'
                )}
              >
                <Image
                  src={images[idx].thumbnail || images[idx].url}
                  alt={images[idx].alt || `Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                {/* Show "+X more" on last thumbnail if more images */}
                {idx === thumbnailIndices[thumbnailIndices.length - 1] && images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-sm font-medium text-white">
                      +{images.length - 4} more
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile/Tablet Thumbnails - fixed row of 3 */}
      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-3 gap-2 lg:hidden">
          {thumbnailIndices.map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'relative aspect-[4/3] w-full overflow-hidden bg-nest-gray',
                currentIndex === idx && 'ring-2 ring-nest-olive'
              )}
            >
              <Image
                src={images[idx].thumbnail || images[idx].url}
                alt={images[idx].alt || `Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="33vw"
              />
              {/* Show "+X more" on last thumbnail if more images */}
              {idx === thumbnailIndices[thumbnailIndices.length - 1] && images.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-sm font-medium text-white">
                    +{images.length - 4} more
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Preload adjacent images for smoother navigation */}
      <div className="hidden" aria-hidden="true">
        {preloadIndices.map((idx) => (
          <Image
            key={`preload-${idx}`}
            src={images[idx].url}
            alt=""
            width={1}
            height={1}
            priority={false}
            loading="eager"
          />
        ))}
      </div>

      {/* Lightbox - Click on backdrop to close */}
      {lightboxOpen && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="relative h-[80vh] w-[90vw] touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || `${title} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Thumbnail strip at bottom */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4">
            <div className="flex gap-2 overflow-x-auto rounded bg-black/50 p-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={cn(
                    'relative h-12 w-16 shrink-0 overflow-hidden rounded transition-all',
                    index === currentIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  )}
                >
                  <Image
                    src={image.thumbnail || image.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
