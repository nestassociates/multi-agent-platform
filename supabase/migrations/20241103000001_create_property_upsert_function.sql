-- Create function to upsert property from Apex27 with PostGIS support
-- This function handles the complex upsert logic and PostGIS POINT creation

CREATE OR REPLACE FUNCTION upsert_property_from_apex27(
  p_agent_id UUID,
  p_apex27_id TEXT,
  p_transaction_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_price NUMERIC,
  p_bedrooms INTEGER,
  p_bathrooms INTEGER,
  p_property_type TEXT,
  p_address JSONB,
  p_postcode TEXT,
  p_location_wkt TEXT, -- WKT format: 'SRID=4326;POINT(lng lat)'
  p_features TEXT[],
  p_floor_plan_url TEXT,
  p_virtual_tour_url TEXT,
  p_status TEXT,
  p_is_featured BOOLEAN,
  p_is_hidden BOOLEAN,
  p_raw_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_property_id UUID;
BEGIN
  -- Insert or update property
  INSERT INTO properties (
    agent_id,
    apex27_id,
    transaction_type,
    title,
    description,
    price,
    bedrooms,
    bathrooms,
    property_type,
    address,
    postcode,
    location,
    features,
    floor_plan_url,
    virtual_tour_url,
    status,
    is_featured,
    is_hidden,
    raw_data,
    updated_at
  )
  VALUES (
    p_agent_id,
    p_apex27_id,
    p_transaction_type,
    p_title,
    p_description,
    p_price,
    p_bedrooms,
    p_bathrooms,
    p_property_type,
    p_address,
    p_postcode,
    CASE WHEN p_location_wkt IS NOT NULL THEN p_location_wkt::geography ELSE NULL END,
    p_features,
    p_floor_plan_url,
    p_virtual_tour_url,
    p_status,
    p_is_featured,
    p_is_hidden,
    p_raw_data,
    NOW()
  )
  ON CONFLICT (agent_id, apex27_id)
  DO UPDATE SET
    transaction_type = EXCLUDED.transaction_type,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    bedrooms = EXCLUDED.bedrooms,
    bathrooms = EXCLUDED.bathrooms,
    property_type = EXCLUDED.property_type,
    address = EXCLUDED.address,
    postcode = EXCLUDED.postcode,
    location = EXCLUDED.location,
    features = EXCLUDED.features,
    floor_plan_url = EXCLUDED.floor_plan_url,
    virtual_tour_url = EXCLUDED.virtual_tour_url,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured,
    is_hidden = EXCLUDED.is_hidden,
    raw_data = EXCLUDED.raw_data,
    updated_at = NOW()
  RETURNING id INTO v_property_id;

  RETURN v_property_id;
END;
$$;

COMMENT ON FUNCTION upsert_property_from_apex27 IS
  'Upserts a property from Apex27 API data with PostGIS location support';
