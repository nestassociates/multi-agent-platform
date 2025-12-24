'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface PropertyMapProps {
  latitude: number | null
  longitude: number | null
  title: string
}

// Greyscale map style
const GREYSCALE_STYLE = 'mapbox://styles/mapbox/light-v11'

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = token

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: GREYSCALE_STYLE,
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    })

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    )

    // Add attribution control in corner
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }))

    // Create custom marker element
    const markerEl = document.createElement('div')
    markerEl.className = 'custom-marker'
    markerEl.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #54714B;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9,22 9,12 15,12 15,22"></polyline>
        </svg>
      </div>
    `

    // Add marker
    marker.current = new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">${title}</div>`
        )
      )
      .addTo(map.current)

    // Cleanup on unmount
    return () => {
      marker.current?.remove()
      map.current?.remove()
    }
  }, [latitude, longitude, title])

  // Don't render if no coordinates
  if (!latitude || !longitude) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium uppercase tracking-nest text-black">
        Location
      </h3>
      <div
        ref={mapContainer}
        className="mt-4 aspect-[2/1] w-full overflow-hidden rounded-lg border border-nest-gray"
      />
    </div>
  )
}
