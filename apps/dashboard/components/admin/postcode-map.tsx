'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface PostcodeMapProps {
  postcodes: any[];
  selectedPostcodes: string[];
  onPostcodeClick?: (postcodeCode: string) => void;
  center?: [number, number];
  zoom?: number;
}

export default function PostcodeMap({
  postcodes = [],
  selectedPostcodes = [],
  onPostcodeClick,
  center = [-3.1006, 51.0151], // Taunton
  zoom = 12,
}: PostcodeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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

    map.current.on('load', () => {
      setIsMapLoaded(true);
      setTimeout(() => map.current?.resize(), 100);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Render postcodes on map
  useEffect(() => {
    if (!map.current || !isMapLoaded || postcodes.length === 0) return;

    // Remove existing layers
    if (map.current.getLayer('postcodes-fill')) {
      map.current.removeLayer('postcodes-fill');
      map.current.removeLayer('postcodes-outline');
      map.current.removeSource('postcodes');
    }

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
        },
        geometry: pc.boundary, // Already GeoJSON from database
      })),
    };

    // Add source
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
          '#94a3b8'  // Gray for unselected
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

    // Add click handler
    map.current.on('click', 'postcodes-fill', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const postcodeCode = feature.properties?.code;

      if (postcodeCode && onPostcodeClick) {
        onPostcodeClick(postcodeCode);
      }

      // Show popup
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${postcodeCode}</h3>
            <p style="font-size: 12px; color: #666;">Click to toggle selection</p>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'postcodes-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'postcodes-fill', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

  }, [postcodes, selectedPostcodes, isMapLoaded]);

  return (
    <div className="relative w-full" style={{ height: '600px' }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden border" style={{ width: '100%', height: '100%' }} />

      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium">{postcodes.length} postcodes loaded</p>
        <p className="text-xs text-muted-foreground">{selectedPostcodes.length} selected</p>
      </div>
    </div>
  );
}
