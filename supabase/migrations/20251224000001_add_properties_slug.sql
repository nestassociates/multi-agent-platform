-- Add slug column to properties for efficient lookups
-- This avoids fetching all properties to find one by slug

-- Add the slug column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug text;

-- Create a function to generate slug from title
CREATE OR REPLACE FUNCTION generate_property_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(title, ''),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate slug for existing properties with unique suffix for duplicates
-- First pass: set slug for all
UPDATE properties
SET slug = generate_property_slug(title)
WHERE slug IS NULL AND title IS NOT NULL;

-- Second pass: append property ID to duplicate slugs to make them unique
UPDATE properties p1
SET slug = slug || '-' || id::text
WHERE EXISTS (
  SELECT 1 FROM properties p2
  WHERE p2.slug = p1.slug
    AND p2.id < p1.id
);

-- Create unique index on slug for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug) WHERE slug IS NOT NULL;

-- Create trigger to auto-generate slug on insert/update
-- Handles duplicates by appending ID if necessary
CREATE OR REPLACE FUNCTION set_property_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_property_slug(NEW.title);
    final_slug := base_slug;

    -- Check for duplicates and append counter if needed
    WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter::text;
    END LOOP;

    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_property_slug ON properties;
CREATE TRIGGER trigger_set_property_slug
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_slug();

-- Add comment for documentation
COMMENT ON COLUMN properties.slug IS 'URL-friendly slug generated from title, used for efficient property lookups';
