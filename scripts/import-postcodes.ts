/**
 * Import UK Postcode Districts from GeoJSON to Database
 *
 * Reads GeoJSON files from uk-postcode-polygons repo and generates SQL INSERT statements
 * for the postcodes table.
 *
 * Usage: npx tsx scripts/import-postcodes.ts
 */

import fs from 'fs';
import path from 'path';

const GEOJSON_DIR = '/tmp/uk-postcode-polygons/geojson';
const OUTPUT_FILE = path.join(__dirname, '../supabase/migrations/20251122000002_import_postcodes.sql');

interface PostcodeFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    name: string;
    description: string;
  };
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: PostcodeFeature[];
}

function calculateCentroid(coordinates: number[][][]): [number, number] {
  // Get exterior ring (first array)
  const ring = coordinates[0];

  let sumLng = 0;
  let sumLat = 0;
  const count = ring.length;

  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }

  return [sumLng / count, sumLat / count];
}

function calculateArea(coordinates: number[][][]): number {
  // Approximate area using shoelace formula
  const ring = coordinates[0];
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }

  area = Math.abs(area / 2);

  // Convert to approximate km² (rough conversion for UK)
  const DEGREES_TO_KM = 111.32; // km per degree at equator
  return area * Math.pow(DEGREES_TO_KM, 2);
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function geometryToWKT(geometry: { type: 'Polygon'; coordinates: number[][][] }): string | null {
  if (!geometry.coordinates || !geometry.coordinates[0]) {
    return null;
  }
  const ring = geometry.coordinates[0];
  if (ring.length === 0) {
    return null;
  }
  const points = ring.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
  return `POLYGON((${points}))`;
}

async function main() {
  console.log('🚀 Starting postcode import...');
  console.log(`📂 Reading from: ${GEOJSON_DIR}`);

  const files = fs.readdirSync(GEOJSON_DIR).filter(f => f.endsWith('.geojson'));
  console.log(`📁 Found ${files.length} area files`);

  let sqlStatements: string[] = [];
  let totalPostcodes = 0;

  // Add migration header
  sqlStatements.push('-- Import UK Postcode Districts from OS Open Data');
  sqlStatements.push('-- Source: uk-postcode-polygons (GitHub)');
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
  sqlStatements.push('');

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const geojson: GeoJSON = JSON.parse(content);

    console.log(`Processing ${file}: ${geojson.features.length} postcodes`);

    for (const feature of geojson.features) {
      const code = feature.properties.name;
      const boundary = geometryToWKT(feature.geometry);

      if (!boundary) {
        console.warn(`⚠️  Skipping ${code} - invalid geometry`);
        continue;
      }

      const [lng, lat] = calculateCentroid(feature.geometry.coordinates);
      const area = calculateArea(feature.geometry.coordinates);

      const sql = `INSERT INTO postcodes (code, boundary, center_point, area_km2) VALUES ('${code}', ST_GeogFromText('${boundary}'), ST_Point(${lng}, ${lat})::geography, ${area.toFixed(4)});`;

      sqlStatements.push(sql);
      totalPostcodes++;
    }
  }

  console.log(`\n✅ Generated ${totalPostcodes} postcode INSERT statements`);

  // Write to migration file
  fs.writeFileSync(OUTPUT_FILE, sqlStatements.join('\n'));
  console.log(`📝 Written to: ${OUTPUT_FILE}`);
  console.log(`\n🎉 Import script complete! Run the migration to import postcodes.`);
}

main().catch(console.error);
