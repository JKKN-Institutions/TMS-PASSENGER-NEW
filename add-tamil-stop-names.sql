-- Migration: Add Tamil stop names support
-- Description: Adds a stop_name_tamil column to route_stops table and populates it with Tamil translations

-- Step 1: Add tamil_name column to route_stops table
ALTER TABLE route_stops
ADD COLUMN IF NOT EXISTS stop_name_tamil VARCHAR(255);

-- Step 2: Add comment to the column
COMMENT ON COLUMN route_stops.stop_name_tamil IS 'Tamil translation of the stop name';

-- Step 3: Populate Tamil stop names with common translations
-- These are common place names in Tamil Nadu with their Tamil equivalents

UPDATE route_stops SET stop_name_tamil = 'பூதூர்' WHERE stop_name ILIKE 'Puthur';
UPDATE route_stops SET stop_name_tamil = 'குருவாரெட்டியூர்' WHERE stop_name ILIKE 'Guruvareddiyur';
UPDATE route_stops SET stop_name_tamil = 'ஆலமரம்' WHERE stop_name ILIKE 'Aalamaram';
UPDATE route_stops SET stop_name_tamil = 'பூவம்பாளையம்' WHERE stop_name ILIKE 'Poovampalayam';
UPDATE route_stops SET stop_name_tamil = 'பூனாச்சி' WHERE stop_name ILIKE 'Poonachi';
UPDATE route_stops SET stop_name_tamil = 'கணபதிபாளையம்' WHERE stop_name ILIKE 'Ganapathipalayam';
UPDATE route_stops SET stop_name_tamil = 'நால்ரோடு' WHERE stop_name ILIKE 'Naalroad';
UPDATE route_stops SET stop_name_tamil = 'பஸ் ஸ்டாண்ட்' WHERE stop_name ILIKE 'Bus Stand';
UPDATE route_stops SET stop_name_tamil = 'பஸ் நிலையம்' WHERE stop_name ILIKE 'Bus Station';
UPDATE route_stops SET stop_name_tamil = 'ரயில் நிலையம்' WHERE stop_name ILIKE 'Railway Station';
UPDATE route_stops SET stop_name_tamil = 'கல்லூரி' WHERE stop_name ILIKE 'College';
UPDATE route_stops SET stop_name_tamil = 'பள்ளி' WHERE stop_name ILIKE 'School';
UPDATE route_stops SET stop_name_tamil = 'சந்தை' WHERE stop_name ILIKE 'Market';
UPDATE route_stops SET stop_name_tamil = 'மருத்துவமனை' WHERE stop_name ILIKE 'Hospital';
UPDATE route_stops SET stop_name_tamil = 'கோயில்' WHERE stop_name ILIKE 'Temple';
UPDATE route_stops SET stop_name_tamil = 'பூங்கா' WHERE stop_name ILIKE 'Park';
UPDATE route_stops SET stop_name_tamil = 'ஜேகேகேஎன் கல்லூரி' WHERE stop_name ILIKE '%JKKN%' OR stop_name ILIKE '%College%';

-- Step 4: For any stops that don't have Tamil names yet, copy the English name as fallback
UPDATE route_stops
SET stop_name_tamil = stop_name
WHERE stop_name_tamil IS NULL OR stop_name_tamil = '';

-- Step 5: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_route_stops_tamil ON route_stops(stop_name_tamil);

-- Step 6: Verify the update
SELECT
    stop_name as english_name,
    stop_name_tamil as tamil_name,
    sequence_order
FROM route_stops
ORDER BY sequence_order
LIMIT 20;
