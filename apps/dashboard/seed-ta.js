require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = JSON.parse(fs.readFileSync('/tmp/uk-postcode-polygons/geojson/TA.geojson', 'utf-8'));

async function seed() {
  for (const feature of data.features) {
    const coords = feature.geometry.coordinates[0];
    const wkt = 'POLYGON((' + coords.map(c => c.join(' ')).join(', ') + '))';
    const center = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0,0]).map(v => v/coords.length);
    
    await supabase.rpc('insert_postcode', {
      p_code: feature.properties.name,
      p_boundary_wkt: wkt,
      p_lng: center[0],
      p_lat: center[1],
      p_area_km2: 10
    });
    console.log('✓', feature.properties.name);
  }
  console.log('Done!');
}

seed();
