-- Add Tamil stop names column to route_stops table
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS stop_name_ta TEXT;

-- Add comment
COMMENT ON COLUMN route_stops.stop_name_ta IS 'Tamil translation of stop name';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_name_ta ON route_stops(stop_name_ta);
