'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface PostcodeMapProps {
  // Sectors are now the primary data source
  sectors: any[];
  selectedSectors: string[];
  onSectorClick?: (sectorCode: string) => void;
  sectorAssignments?: Record<string, { agentId: string; agentName: string; color: string }>;
  onMapClick?: (area: string) => void;
  isLoadingSectors?: boolean;
  selectedArea?: string;
  center?: [number, number];
  zoom?: number;
}

export default function PostcodeMap({
  sectors = [],
  selectedSectors = [],
  onSectorClick,
  sectorAssignments = {},
  onMapClick,
  isLoadingSectors = false,
  selectedArea = '',
  center = [-3.1006, 51.0151], // Taunton
  zoom = 12,
}: PostcodeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoverArea, setHoverArea] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store map position to prevent unwanted resets
  const mapPositionRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use saved position if available, otherwise use props
    const initialCenter = mapPositionRef.current?.center || center;
    const initialZoom = mapPositionRef.current?.zoom || zoom;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
      setTimeout(() => map.current?.resize(), 100);
    });

    // Track map position changes to preserve on re-renders
    map.current.on('moveend', () => {
      if (map.current) {
        const center = map.current.getCenter();
        mapPositionRef.current = {
          center: [center.lng, center.lat],
          zoom: map.current.getZoom(),
        };
      }
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
        layers: ['sectors-fill'],
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
                  .setHTML(
                    `<div style="padding: 8px; font-size: 13px;">Click to load <strong>${area}</strong> sectors</div>`
                  )
                  .addTo(map.current!);
              }
            }
          } catch (error) {
            console.error('Error detecting area:', error);
          }
        }, 1000);
      } else {
        // Hovering over sector - remove tooltip
        hoverPopup.remove();
        setHoverArea(null);
      }
    });

    // Click handler to load area
    map.current.on('click', async (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['sectors-fill'],
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

  // Render sectors on map
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Create GeoJSON from sectors
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sectors
        .map((sector) => {
          const assignment = sectorAssignments[sector.code];
          return {
            type: 'Feature' as const,
            id: sector.code,
            properties: {
              code: sector.code,
              district_code: sector.district_code,
              area_km2: sector.area_km2,
              selected: selectedSectors.includes(sector.code),
              assigned: !!assignment,
              agentColor: assignment?.color || '#94a3b8',
              agentName: assignment?.agentName || '',
            },
            geometry: sector.boundary,
          };
        })
        .filter((f) => f.geometry), // Only include features with valid geometry
    };

    // Check if source exists
    const source = map.current.getSource('sectors') as mapboxgl.GeoJSONSource;

    if (source) {
      // Update existing source data instead of recreating layers
      source.setData(geojson);
      return;
    }

    // First time - create source and layers
    map.current.addSource('sectors', {
      type: 'geojson',
      data: geojson,
    });

    // Add fill layer
    map.current.addLayer({
      id: 'sectors-fill',
      type: 'fill',
      source: 'sectors',
      paint: {
        'fill-color': [
          'case',
          ['get', 'selected'],
          '#22c55e', // Green for selected
          ['get', 'assigned'],
          ['get', 'agentColor'], // Agent's color if assigned
          '#e2e8f0', // Light gray for unassigned
        ],
        'fill-opacity': ['case', ['get', 'selected'], 0.5, ['get', 'assigned'], 0.4, 0.3],
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'sectors-outline',
      type: 'line',
      source: 'sectors',
      paint: {
        'line-color': [
          'case',
          ['get', 'selected'],
          '#16a34a', // Dark green for selected
          ['get', 'assigned'],
          ['get', 'agentColor'], // Agent's color for assigned
          '#475569', // Dark gray for unassigned
        ],
        'line-width': ['case', ['get', 'selected'], 3, ['get', 'assigned'], 2, 1.5],
      },
    });

    // Add text labels for sector codes
    map.current.addLayer({
      id: 'sectors-labels',
      type: 'symbol',
      source: 'sectors',
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 11,
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

    // Add click handler for sectors
    map.current.on('click', 'sectors-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const sectorCode = feature.properties?.code;

      if (sectorCode && onSectorClick) {
        onSectorClick(sectorCode);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'sectors-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'sectors-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, [sectors, selectedSectors, sectorAssignments, isMapLoaded, onSectorClick]);

  // Fit bounds when sectors load
  useEffect(() => {
    if (!map.current || !isMapLoaded || sectors.length === 0) return;

    // Only fit bounds on initial load (when coming from 0 sectors)
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    sectors.forEach((sector) => {
      if (sector.boundary?.coordinates?.[0]) {
        sector.boundary.coordinates[0].forEach((coord: [number, number]) => {
          bounds.extend(coord);
          hasValidBounds = true;
        });
      }
    });

    if (hasValidBounds && !mapPositionRef.current) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 13 });
    }
  }, [sectors.length > 0, isMapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div
        ref={mapContainer}
        className="absolute inset-0 rounded-lg overflow-hidden border"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Legend - top left */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold mb-2">Assignment Status</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm"
              style={{ backgroundColor: '#e2e8f0', opacity: 0.6 }}
            />
            <span>Unassigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm border-2"
              style={{ backgroundColor: '#ef4444', opacity: 0.4, borderColor: '#ef4444' }}
            />
            <span>Agent Territory</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm border-2"
              style={{ backgroundColor: '#22c55e', opacity: 0.5, borderColor: '#16a34a' }}
            />
            <span>Selected</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2">
          Click empty area to load sectors
        </p>
      </div>

      {/* Status panel - bottom left */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        {isLoadingSectors ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm font-medium">Loading {selectedArea} sectors...</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">
              {sectors.length} sectors loaded {selectedArea && `(${selectedArea})`}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedSectors.length} selected
              {sectors.length === 0 && ' - Click on map to load an area'}
            </p>
          </>
        )}
      </div>

      {/* Data attribution - bottom right */}
      <div className="absolute bottom-4 right-4 bg-white/80 px-2 py-1 rounded text-[10px] text-muted-foreground">
        Sector data Geolytix 2012 (Open Data)
      </div>
    </div>
  );
}
