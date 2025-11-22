/**
 * Seed Postcodes Directly to Database
 * Uses Supabase client to insert postcodes from GeoJSON
 *
 * Usage: npx tsx scripts/seed-postcodes.ts [area-code]
 * Example: npx tsx scripts/seed-postcodes.ts TA (imports only TA postcodes)
 * Example: npx tsx scripts/seed-postcodes.ts (imports all)
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const GEOJSON_DIR = '/tmp/uk-postcode-polygons/geojson';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function calculateCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / ring.length, sumLat / ring.length];
}

function calculateArea(coordinates: number[][][]): number {
  const ring = coordinates[0];
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area / 2);
  const DEGREES_TO_KM = 111.32;
  return area * Math.pow(DEGREES_TO_KM, 2);
}

function geometryToWKT(geometry: any): string | null {
  if (!geometry.coordinates || !geometry.coordinates[0]) return null;
  const ring = geometry.coordinates[0];
  if (ring.length === 0) return null;
  const points = ring.map(([lng, lat]: number[]) => `${lng} ${lat}`).join(', ');
  return `POLYGON((${points}))`;
}

async function main() {
  const areaFilter = process.argv[2]; // e.g., "TA" to import only TA postcodes

  console.log('🚀 Starting postcode seeding...');
  if (areaFilter) {
    console.log(`📍 Filtering for area: ${areaFilter}`);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(f => {
    if (!f.endsWith('.geojson')) return false;
    if (areaFilter) {
      return f.startsWith(areaFilter);
    }
    return true;
  });

  console.log(`📁 Found ${files.length} files to process`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const geojson = JSON.parse(content);

    console.log(`\nProcessing ${file}: ${geojson.features.length} postcodes`);

    for (const feature of geojson.features) {
      const code = feature.properties.name;
      const boundary = geometryToWKT(feature.geometry);

      if (!boundary) {
        console.warn(`⚠️  Skipping ${code} - invalid geometry`);
        totalSkipped++;
        continue;
      }

      const [lng, lat] = calculateCentroid(feature.geometry.coordinates);
      const area = calculateArea(feature.geometry.coordinates);

      // Insert using Supabase client
      const { error } = await supabase.rpc('insert_postcode', {
        p_code: code,
        p_boundary_wkt: boundary,
        p_lng: lng,
        p_lat: lat,
        p_area_km2: area
      });

      if (error) {
        console.error(`❌ Error inserting ${code}:`, error.message);
        totalSkipped++;
      } else {
        totalInserted++;
        if (totalInserted % 10 === 0) {
          process.stdout.write(`\r✅ Inserted ${totalInserted} postcodes...`);
        }
      }
    }
  }

  console.log(`\n\n🎉 Seeding complete!`);
  console.log(`✅ Inserted: ${totalInserted}`);
  console.log(`⚠️  Skipped: ${totalSkipped}`);
}

main().catch(console.error);
