'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Mapbox access token from environment
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Debug: Log if token is missing
if (!mapboxgl.accessToken) {
  console.error('MAPBOX TOKEN MISSING! Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local');
} else {
  console.log('Mapbox token configured:', mapboxgl.accessToken.substring(0, 20) + '...');
}

interface Territory {
  id: string;
  name: string;
  agent_id: string;
  boundary: any; // GeoJSON geometry
  property_count: number;
  color?: string;
  agent?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

interface TerritoryMapProps {
  territories: Territory[];
  onDrawCreate?: (feature: any) => void;
  onDrawUpdate?: (feature: any) => void;
  onDrawDelete?: (featureId: string) => void;
  onTerritoryClick?: (territory: Territory) => void;
  allowDrawing?: boolean;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  searchRadius?: {
    center: [number, number];
    radiusMeters: number;
  } | null;
}

export default function TerritoryMap({
  territories = [],
  onDrawCreate,
  onDrawUpdate,
  onDrawDelete,
  onTerritoryClick,
  allowDrawing = true,
  center = [-3.1006, 51.0151], // Taunton, UK
  zoom = 12,
  searchRadius = null,
}: TerritoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Ensure container has dimensions before initializing map
    if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
      console.warn('Map container has no dimensions, waiting...');
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
    });

    // Force resize after map loads
    map.current.on('load', () => {
      setIsMapLoaded(true);
      // Resize map to fit container
      setTimeout(() => {
        map.current?.resize();
      }, 100);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // T153: Initialize drawing controls if allowed
    if (allowDrawing) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
        styles: [
          // Custom styles for drawing
          {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#3bb2d0',
              'fill-outline-color': '#3bb2d0',
              'fill-opacity': 0.2,
            },
          },
          {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#fbb03b',
              'fill-outline-color': '#fbb03b',
              'fill-opacity': 0.3,
            },
          },
          {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#3bb2d0',
              'line-width': 2,
            },
          },
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#fbb03b',
              'line-width': 3,
            },
          },
          {
            id: 'gl-draw-polygon-midpoint',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            paint: {
              'circle-radius': 4,
              'circle-color': '#fbb03b',
            },
          },
          {
            id: 'gl-draw-polygon-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 6,
              'circle-color': '#fbb03b',
            },
          },
        ],
      });

      map.current.addControl(draw.current as any, 'top-left');

      // T153: Drawing event handlers
      map.current.on('draw.create', (e: any) => {
        console.log('🎨 [MAP] draw.create event fired', {
          featuresCount: e.features?.length,
          feature: e.features?.[0],
          timestamp: new Date().toISOString(),
        });
        if (onDrawCreate && e.features && e.features.length > 0) {
          console.log('🎨 [MAP] Calling onDrawCreate handler');
          onDrawCreate(e.features[0]);
        }
      });

      map.current.on('draw.update', (e: any) => {
        console.log('🎨 [MAP] draw.update event fired', {
          featuresCount: e.features?.length,
          timestamp: new Date().toISOString(),
        });
        if (onDrawUpdate && e.features && e.features.length > 0) {
          console.log('🎨 [MAP] Calling onDrawUpdate handler');
          onDrawUpdate(e.features[0]);
        }
      });

      map.current.on('draw.delete', (e: any) => {
        console.log('🎨 [MAP] draw.delete event fired', {
          featuresCount: e.features?.length,
          timestamp: new Date().toISOString(),
        });
        if (onDrawDelete && e.features && e.features.length > 0) {
          console.log('🎨 [MAP] Calling onDrawDelete handler');
          onDrawDelete(e.features[0].id as string);
        }
      });

      // Add handler for selection changes (debugging)
      map.current.on('draw.selectionchange', (e: any) => {
        console.log('🎨 [MAP] draw.selectionchange event fired', {
          featuresCount: e.features?.length,
          timestamp: new Date().toISOString(),
        });
      });

      // Add handler for mode changes (debugging)
      map.current.on('draw.modechange', (e: any) => {
        console.log('🎨 [MAP] draw.modechange event fired', {
          mode: e.mode,
          timestamp: new Date().toISOString(),
        });
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // T155: Display existing territories on map
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing territory layers and sources
    if (map.current.getLayer('territories-fill')) {
      map.current.removeLayer('territories-fill');
    }
    if (map.current.getLayer('territories-outline')) {
      map.current.removeLayer('territories-outline');
    }
    if (map.current.getSource('territories')) {
      map.current.removeSource('territories');
    }

    if (territories.length === 0) return;

    // Create GeoJSON FeatureCollection from territories
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: territories.map((territory) => ({
        type: 'Feature',
        id: territory.id,
        properties: {
          id: territory.id,
          name: territory.name,
          agent_id: territory.agent_id,
          property_count: territory.property_count,
          color: territory.color || '#3bb2d0',
          agent_name: territory.agent
            ? `${territory.agent.profile.first_name} ${territory.agent.profile.last_name}`
            : 'Unknown',
        },
        geometry: territory.boundary,
      })),
    };

    // Add source
    map.current.addSource('territories', {
      type: 'geojson',
      data: geojson,
    });

    // Add fill layer (colored polygons)
    map.current.addLayer({
      id: 'territories-fill',
      type: 'fill',
      source: 'territories',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.3,
      },
    });

    // Add outline layer
    map.current.addLayer({
      id: 'territories-outline',
      type: 'line',
      source: 'territories',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
      },
    });

    // Add click handler for territories
    map.current.on('click', 'territories-fill', (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const territory = territories.find((t) => t.id === feature.id);

      if (territory && onTerritoryClick) {
        onTerritoryClick(territory);
      }

      // Show popup with territory info
      if (feature.properties) {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${feature.properties.name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Agent: ${feature.properties.agent_name}</p>
              <p style="font-size: 12px; color: #666;">Properties: ${feature.properties.property_count}</p>
            </div>
          `
          )
          .addTo(map.current!);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'territories-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'territories-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    // Fit map to show all territories
    if (territories.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      let hasValidBounds = false;

      territories.forEach((territory) => {
        if (territory.boundary && territory.boundary.type === 'Polygon' && territory.boundary.coordinates) {
          territory.boundary.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord);
            hasValidBounds = true;
          });
        }
      });

      // Only fit bounds if we have valid coordinates
      if (hasValidBounds) {
        try {
          map.current.fitBounds(bounds, { padding: 50 });
        } catch (error) {
          console.warn('Error fitting bounds:', error);
        }
      }
    }
  }, [territories, isMapLoaded]);

  // Display search radius circle when provided
  useEffect(() => {
    if (!map.current || !isMapLoaded || !searchRadius) {
      // Remove radius circle if no searchRadius
      if (map.current && map.current.getLayer('search-radius-fill')) {
        map.current.removeLayer('search-radius-fill');
        map.current.removeLayer('search-radius-outline');
        map.current.removeSource('search-radius');
      }
      return;
    }

    const { center: radiusCenter, radiusMeters } = searchRadius;

    // Create a circle around the center point
    const metersPerDegree = 111320; // Approximate meters per degree at equator
    const radiusDegrees = radiusMeters / metersPerDegree;

    // Generate circle points
    const points = 64;
    const circleCoords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const lng = radiusCenter[0] + radiusDegrees * Math.cos(angle) / Math.cos(radiusCenter[1] * Math.PI / 180);
      const lat = radiusCenter[1] + radiusDegrees * Math.sin(angle);
      circleCoords.push([lng, lat]);
    }

    const circleGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { radius: radiusMeters },
        geometry: {
          type: 'Polygon',
          coordinates: [circleCoords],
        },
      }],
    };

    // Remove existing circle
    if (map.current.getLayer('search-radius-fill')) {
      map.current.removeLayer('search-radius-fill');
      map.current.removeLayer('search-radius-outline');
      map.current.removeSource('search-radius');
    }

    // Add circle to map
    map.current.addSource('search-radius', {
      type: 'geojson',
      data: circleGeoJSON,
    });

    map.current.addLayer({
      id: 'search-radius-fill',
      type: 'fill',
      source: 'search-radius',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.1,
      },
    });

    map.current.addLayer({
      id: 'search-radius-outline',
      type: 'line',
      source: 'search-radius',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
  }, [searchRadius, isMapLoaded]);

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden border" style={{ width: '100%', height: '100%' }} />

      {/* Drawing Instructions */}
      {allowDrawing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
          <p className="font-medium">Click the polygon tool to draw a territory</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to add points, double-click to finish
          </p>
        </div>
      )}

      {/* Territory Count Badge */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium">{territories.length} territories</p>
      </div>
    </div>
  );
}
