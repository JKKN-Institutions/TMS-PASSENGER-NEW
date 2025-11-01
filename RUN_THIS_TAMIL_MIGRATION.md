# Tamil Stop Names Migration Guide

This guide will help you add Tamil translations for all stop names in the driver application.

## Prerequisites

You need to run this migration **once** to add Tamil support to the database.

## Step 1: Add the Tamil Column

Run this SQL in your Supabase SQL Editor:

```sql
-- Add column for Tamil stop names
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS stop_name_ta TEXT;

-- Add comment
COMMENT ON COLUMN route_stops.stop_name_ta IS 'Tamil translation of stop name';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_route_stops_stop_name_ta ON route_stops(stop_name_ta);
```

## Step 2: Populate Tamil Names

Run the provided script to populate all Tamil names:

```bash
cd TMS-PASSENGER
node ../add-tamil-stop-names.js
```

This script will:
- Check if the column exists
- Update all stops with their Tamil translations
- Use English names as fallback for untranslated stops
- Show a summary of updates

## Step 3: Verify

After running the script, verify the data:

```sql
SELECT stop_name, stop_name_ta
FROM route_stops
ORDER BY sequence_order
LIMIT 10;
```

## Done!

The driver application will now automatically display Tamil stop names when the user switches to Tamil language.

## Alternative: Manual SQL Migration

If you prefer to run everything in SQL, use the file: `add-tamil-stop-names.sql`

Note: The JavaScript method is recommended as it includes comprehensive translations for all stops.
