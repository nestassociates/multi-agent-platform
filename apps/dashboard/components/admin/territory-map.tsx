'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

// Mapbox access token from environment
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

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
}

export default function TerritoryMap({
  territories = [],
  onDrawCreate,
  onDrawUpdate,
  onDrawDelete,
  onTerritoryClick,
  allowDrawing = true,
  center = [-2.2426, 53.4808], // Manchester, UK
  zoom = 11,
}: TerritoryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
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
        if (onDrawCreate && e.features && e.features.length > 0) {
          onDrawCreate(e.features[0]);
        }
      });

      map.current.on('draw.update', (e: any) => {
        if (onDrawUpdate && e.features && e.features.length > 0) {
          onDrawUpdate(e.features[0]);
        }
      });

      map.current.on('draw.delete', (e: any) => {
        if (onDrawDelete && e.features && e.features.length > 0) {
          onDrawDelete(e.features[0].id as string);
        }
      });
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

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
    if (territories.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      territories.forEach((territory) => {
        if (territory.boundary.type === 'Polygon') {
          territory.boundary.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        }
      });

      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [territories, isMapLoaded]);

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden border" />

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
