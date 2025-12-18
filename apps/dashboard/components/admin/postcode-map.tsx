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
  sectorAssignments?: Record<string, { agentId: string, agentName: string, color: string }>;
  districtsWithSectors?: { districts: Set<string>, colors: Record<string, string> };
  assignedSectorBoundaries?: any[]; // Sector boundaries to show at district level
  onMapClick?: (area: string) => void;
  isLoadingPostcodes?: boolean;
  selectedArea?: string;
  center?: [number, number];
  zoom?: number;
  // Sector drill-down props (Feature 008)
  expandedDistrict?: string | null;
  sectors?: any[];
  selectedSectors?: string[];
  onSectorClick?: (sectorCode: string) => void;
  onDistrictDrillDown?: (districtCode: string) => void;
  isLoadingSectors?: boolean;
}

export default function PostcodeMap({
  postcodes = [],
  selectedPostcodes = [],
  onPostcodeClick,
  postcodeAssignments = {},
  sectorAssignments = {},
  districtsWithSectors = { districts: new Set(), colors: {} },
  assignedSectorBoundaries = [],
  onMapClick,
  isLoadingPostcodes = false,
  selectedArea = '',
  center = [-3.1006, 51.0151], // Taunton
  zoom = 12,
  // Sector drill-down props
  expandedDistrict = null,
  sectors = [],
  selectedSectors = [],
  onSectorClick,
  onDistrictDrillDown,
  isLoadingSectors = false,
}: PostcodeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoverArea, setHoverArea] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store map position to prevent unwanted resets
  const mapPositionRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  // Track previous expanded district to handle zoom on collapse
  const prevExpandedDistrictRef = useRef<string | null>(null);

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
      features: postcodes.map(pc => {
        // Only show as "assigned" if it's a FULL district assignment (not just sectors)
        const isFullyAssigned = pc.assignment_status === 'full' || !!postcodeAssignments[pc.code];
        // Check if this district has sector-level assignments (from our local tracking)
        const hasSectorAssignments = districtsWithSectors.districts.has(pc.code);
        const sectorAssignmentColor = districtsWithSectors.colors[pc.code] || '#f59e0b';

        return {
          type: 'Feature' as const,
          id: pc.code,
          properties: {
            code: pc.code,
            area_km2: pc.area_km2,
            selected: selectedPostcodes.includes(pc.code),
            assignmentStatus: pc.assignment_status || (postcodeAssignments[pc.code] ? 'full' : 'unassigned'),
            // Only mark as assigned for FULL district assignments
            assigned: isFullyAssigned,
            // Mark districts with sector-level assignments for visual indicator
            hasSectorAssignments: hasSectorAssignments,
            sectorAssignmentColor: sectorAssignmentColor,
            agentColor: postcodeAssignments[pc.code]?.color || '#22c55e',
            sectorCount: pc.sector_count || 0,
            assignedSectorCount: pc.assigned_sector_count || 0,
          },
          geometry: pc.boundary,
        };
      }),
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

    // Add fill layer - only colored for FULL district assignments
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
          ['get', 'agentColor'], // Agent's color if fully assigned
          '#94a3b8'  // Gray for unassigned (including districts with only sector assignments)
        ],
        'fill-opacity': [
          'case',
          ['get', 'selected'],
          0.5,
          ['get', 'assigned'],
          0.4, // Same opacity as sector boundaries
          0.2  // Lower opacity for unassigned
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
          '#2563eb', // Blue for selected
          ['get', 'assigned'],
          ['get', 'agentColor'], // Agent's color for fully assigned
          '#64748b'  // Gray for unassigned
        ],
        'line-width': [
          'case',
          ['get', 'selected'],
          3,
          ['get', 'assigned'],
          2.5,
          1.5
        ],
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
    // Note: We check for sector clicks first to prevent district click when clicking sectors
    map.current.on('click', 'postcodes-fill', (e) => {
      // If sectors layer exists and we clicked on a sector, don't handle district click
      if (map.current?.getLayer('sectors-fill')) {
        const sectorFeatures = map.current.queryRenderedFeatures(e.point, {
          layers: ['sectors-fill']
        });
        if (sectorFeatures.length > 0) {
          return; // Let the sector click handler handle this
        }
      }

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

  }, [postcodes, selectedPostcodes, postcodeAssignments, districtsWithSectors, isMapLoaded]);

  // Render sectors when a district is expanded (Feature 008)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Check if we're collapsing from drill-down view
    const wasExpanded = prevExpandedDistrictRef.current !== null;
    const isCollapsing = wasExpanded && !expandedDistrict;

    // Update the ref for next render
    prevExpandedDistrictRef.current = expandedDistrict;

    // Remove existing sector layers first
    if (map.current.getLayer('sectors-labels')) {
      map.current.removeLayer('sectors-labels');
    }
    if (map.current.getLayer('sectors-outline')) {
      map.current.removeLayer('sectors-outline');
    }
    if (map.current.getLayer('sectors-fill')) {
      map.current.removeLayer('sectors-fill');
    }
    if (map.current.getSource('sectors')) {
      map.current.removeSource('sectors');
    }

    // If collapsing, zoom to fit all loaded postcodes
    if (isCollapsing && postcodes.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      postcodes.forEach(pc => {
        if (pc.boundary?.coordinates?.[0]) {
          pc.boundary.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        }
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      }
      return;
    }

    // If no expanded district or no sectors, don't render
    if (!expandedDistrict || sectors.length === 0) return;

    // Create GeoJSON from sectors
    const sectorGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: sectors.map(sector => {
        // Check if this sector is assigned using sectorAssignments prop
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
          },
          geometry: sector.boundary,
        };
      }).filter(f => f.geometry), // Only include features with valid geometry
    };

    // Add sectors source
    map.current.addSource('sectors', {
      type: 'geojson',
      data: sectorGeojson,
    });

    // Add sector fill layer
    map.current.addLayer({
      id: 'sectors-fill',
      type: 'fill',
      source: 'sectors',
      paint: {
        'fill-color': [
          'case',
          ['get', 'selected'],
          '#22c55e', // Green for selected sectors
          ['get', 'assigned'],
          ['get', 'agentColor'],
          '#e2e8f0'  // Light gray for unassigned sectors
        ],
        'fill-opacity': [
          'case',
          ['get', 'selected'],
          0.5,
          0.3
        ],
      },
    });

    // Add sector outline layer
    map.current.addLayer({
      id: 'sectors-outline',
      type: 'line',
      source: 'sectors',
      paint: {
        'line-color': [
          'case',
          ['get', 'selected'],
          '#16a34a', // Dark green for selected
          '#475569'  // Dark gray for others
        ],
        'line-width': [
          'case',
          ['get', 'selected'],
          3,
          1.5
        ],
      },
    });

    // Add sector labels
    map.current.addLayer({
      id: 'sectors-labels',
      type: 'symbol',
      source: 'sectors',
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 11,
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });

    // Add click handler for sectors
    const sectorClickHandler = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const sectorCode = feature.properties?.code;

      if (sectorCode && onSectorClick) {
        e.preventDefault();
        onSectorClick(sectorCode);
      }
    };

    map.current.on('click', 'sectors-fill', sectorClickHandler);

    // Change cursor on sector hover
    map.current.on('mouseenter', 'sectors-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'sectors-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Zoom to the expanded district
    const expandedPostcode = postcodes.find(p => p.code === expandedDistrict);
    if (expandedPostcode?.boundary) {
      const bounds = new mapboxgl.LngLatBounds();
      const coords = expandedPostcode.boundary.coordinates[0];
      coords.forEach((coord: [number, number]) => {
        bounds.extend(coord);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }

    return () => {
      if (map.current) {
        map.current.off('click', 'sectors-fill', sectorClickHandler);
      }
    };
  }, [expandedDistrict, sectors, selectedSectors, sectorAssignments, isMapLoaded, onSectorClick, postcodes]);

  // Render assigned sector boundaries at district level (always visible)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing assigned sectors layers first
    if (map.current.getLayer('assigned-sectors-labels')) {
      map.current.removeLayer('assigned-sectors-labels');
    }
    if (map.current.getLayer('assigned-sectors-outline')) {
      map.current.removeLayer('assigned-sectors-outline');
    }
    if (map.current.getLayer('assigned-sectors-fill')) {
      map.current.removeLayer('assigned-sectors-fill');
    }
    if (map.current.getSource('assigned-sectors')) {
      map.current.removeSource('assigned-sectors');
    }

    // Don't show assigned sectors if we're drilled down into a district (sectors view is shown instead)
    // Or if there are no assigned sector boundaries
    if (expandedDistrict || assignedSectorBoundaries.length === 0) return;

    // Create GeoJSON from assigned sector boundaries
    const assignedSectorGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: assignedSectorBoundaries.map(sector => ({
        type: 'Feature' as const,
        id: sector.code,
        properties: {
          code: sector.code,
          agentColor: sector.agentColor || '#ef4444',
          agentName: sector.agentName || 'Unknown',
        },
        geometry: sector.boundary,
      })).filter(f => f.geometry), // Only include features with valid geometry
    };

    // Add assigned sectors source
    map.current.addSource('assigned-sectors', {
      type: 'geojson',
      data: assignedSectorGeojson,
    });

    // Add assigned sector fill layer
    map.current.addLayer({
      id: 'assigned-sectors-fill',
      type: 'fill',
      source: 'assigned-sectors',
      paint: {
        'fill-color': ['get', 'agentColor'],
        'fill-opacity': 0.4,
      },
    });

    // Add assigned sector outline layer
    map.current.addLayer({
      id: 'assigned-sectors-outline',
      type: 'line',
      source: 'assigned-sectors',
      paint: {
        'line-color': ['get', 'agentColor'],
        'line-width': 2,
      },
    });

    // Add assigned sector labels
    map.current.addLayer({
      id: 'assigned-sectors-labels',
      type: 'symbol',
      source: 'assigned-sectors',
      layout: {
        'text-field': ['get', 'code'],
        'text-size': 10,
        'text-anchor': 'center',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });

  }, [assignedSectorBoundaries, expandedDistrict, isMapLoaded]);

  // Add double-click handler for district drill-down
  useEffect(() => {
    if (!map.current || !isMapLoaded || !onDistrictDrillDown) return;

    const doubleClickHandler = (e: mapboxgl.MapMouseEvent) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['postcodes-fill']
      });

      if (features.length > 0) {
        const districtCode = features[0].properties?.code;
        if (districtCode) {
          e.preventDefault();
          onDistrictDrillDown(districtCode);
        }
      }
    };

    map.current.on('dblclick', doubleClickHandler);

    return () => {
      if (map.current) {
        map.current.off('dblclick', doubleClickHandler);
      }
    };
  }, [isMapLoaded, onDistrictDrillDown]);

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden border" style={{ width: '100%', height: '100%' }} />

      {/* Legend - top left */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold mb-2">Assignment Status</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#94a3b8', opacity: 0.4 }} />
            <span>Unassigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2" style={{ backgroundColor: '#ef4444', opacity: 0.4, borderColor: '#ef4444' }} />
            <span>Agent Territory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm border-2" style={{ backgroundColor: '#3b82f6', opacity: 0.6, borderColor: '#2563eb' }} />
            <span>Selected</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2">
          Double-click to view sectors inside
        </p>
      </div>

      {/* Status panel - bottom left */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        {isLoadingPostcodes || isLoadingSectors ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm font-medium">
              {isLoadingSectors
                ? `Loading sectors for ${expandedDistrict}...`
                : `Loading ${selectedArea} postcodes...`}
            </p>
          </div>
        ) : expandedDistrict ? (
          <>
            <p className="text-sm font-medium">
              {sectors.length > 0
                ? `${sectors.length} sectors in ${expandedDistrict}`
                : `No sector data for ${expandedDistrict}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {sectors.length > 0
                ? `${selectedSectors.length} selected • Click sector to select • Double-click elsewhere to collapse`
                : 'Sector boundaries not available for this district'}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{postcodes.length} districts loaded {selectedArea && `(${selectedArea})`}</p>
            <p className="text-xs text-muted-foreground">
              {selectedPostcodes.length} selected • Double-click district to view sectors
            </p>
          </>
        )}
      </div>

      {/* Data attribution - bottom right */}
      <div className="absolute bottom-4 right-4 bg-white/80 px-2 py-1 rounded text-[10px] text-muted-foreground">
        Sector data © Geolytix 2012 (Open Data)
      </div>
    </div>
  );
}
