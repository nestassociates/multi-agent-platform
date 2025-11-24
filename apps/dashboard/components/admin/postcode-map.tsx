'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface PostcodeMapProps {
  postcodes: any[];
  selectedPostcodes: string[];
  onPostcodeClick?: (postcodeCode: string) => void;
  postcodeAssignments?: Record<string, { agentId: string, agentName: string, color: string }>;
  onMapClick?: (area: string) => void;
  isLoadingPostcodes?: boolean;
  selectedArea?: string;
  center?: [number, number];
  zoom?: number;
}

export default function PostcodeMap({
  postcodes = [],
  selectedPostcodes = [],
  onPostcodeClick,
  postcodeAssignments = {},
  onMapClick,
  isLoadingPostcodes = false,
  selectedArea = '',
  center = [-3.1006, 51.0151], // Taunton
  zoom = 12,
}: PostcodeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoverArea, setHoverArea] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
      setTimeout(() => map.current?.resize(), 100);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Tooltip popup for hover
    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'area-hover-tooltip',
    });

    // Add hover handler for empty map areas
    map.current.on('mousemove', async (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['postcodes-fill']
      });

      // Clear existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      if (features.length === 0) {
        // Hovering over empty area - detect postcode after 1 second
        hoverTimeoutRef.current = setTimeout(async () => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?types=postcode&country=GB&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
              const postcode = data.features[0].text || '';
              const areaMatch = postcode.match(/^([A-Z]{1,2})/i);
              if (areaMatch) {
                const area = areaMatch[1].toUpperCase();
                setHoverArea(area);
                hoverPopup
                  .setLngLat(e.lngLat)
                  .setHTML(`<div style="padding: 8px; font-size: 13px;">📍 Load postcodes for <strong>${area}</strong></div>`)
                  .addTo(map.current!);
              }
            }
          } catch (error) {
            console.error('Error detecting area:', error);
          }
        }, 1000);
      } else {
        // Hovering over postcode - remove tooltip
        hoverPopup.remove();
        setHoverArea(null);
      }
    });

    // Click handler to load area
    map.current.on('click', async (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['postcodes-fill']
      });

      if (features.length === 0 && onMapClick) {
        // Detect area on click and load it
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?types=postcode&country=GB&access_token=${mapboxgl.accessToken}`
          );
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const postcode = data.features[0].text || '';
            const areaMatch = postcode.match(/^([A-Z]{1,2})/i);
            if (areaMatch) {
              const area = areaMatch[1].toUpperCase();
              onMapClick(area);
              hoverPopup.remove();
              setHoverArea(null);
            }
          }
        } catch (error) {
          console.error('Error detecting area:', error);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Render postcodes on map
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Create GeoJSON from postcodes
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: postcodes.map(pc => ({
        type: 'Feature' as const,
        id: pc.code,
        properties: {
          code: pc.code,
          area_km2: pc.area_km2,
          selected: selectedPostcodes.includes(pc.code),
          assigned: !!postcodeAssignments[pc.code],
          agentColor: postcodeAssignments[pc.code]?.color || null,
        },
        geometry: pc.boundary, // Already GeoJSON from database
      })),
    };

    // Check if source exists
    const source = map.current.getSource('postcodes') as mapboxgl.GeoJSONSource;

    if (source) {
      // Update existing source data instead of recreating layers
      source.setData(geojson);
      return;
    }

    // First time - create source and layers
    map.current.addSource('postcodes', {
      type: 'geojson',
      data: geojson,
    });

    // Add fill layer
    map.current.addLayer({
      id: 'postcodes-fill',
      type: 'fill',
      source: 'postcodes',
      paint: {
        'fill-color': [
          'case',
          ['get', 'selected'],
          '#3b82f6', // Blue for selected
          ['get', 'assigned'],
          ['get', 'agentColor'], // Agent's color if assigned
          '#94a3b8'  // Gray for unassigned
        ],
        'fill-opacity': [
          'case',
          ['get', 'selected'],
          0.4,
          0.2
        ],
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'postcodes-outline',
      type: 'line',
      source: 'postcodes',
      paint: {
        'line-color': [
          'case',
          ['get', 'selected'],
          '#2563eb',
          '#64748b'
        ],
        'line-width': 2,
      },
    });

    // Add text labels for postcode codes
    map.current.addLayer({
      id: 'postcodes-labels',
      type: 'symbol',
      source: 'postcodes',
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });

    // Add click handler (no popup)
    map.current.on('click', 'postcodes-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const postcodeCode = feature.properties?.code;

      if (postcodeCode && onPostcodeClick) {
        onPostcodeClick(postcodeCode);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'postcodes-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'postcodes-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [postcodes, selectedPostcodes, postcodeAssignments, isMapLoaded]);

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden border" style={{ width: '100%', height: '100%' }} />

      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        {isLoadingPostcodes ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm font-medium">Loading {selectedArea} postcodes...</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">{postcodes.length} postcodes loaded {selectedArea && `(${selectedArea})`}</p>
            <p className="text-xs text-muted-foreground">{selectedPostcodes.length} selected • Click map to load area</p>
          </>
        )}
      </div>
    </div>
  );
}
