-- Migration: Add booking_reference column to bookings table
-- Date: 2025-10-31
-- Description: Adds booking_reference column for ticket verification and generates references for existing bookings

-- Add booking_reference column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_reference
ON bookings(booking_reference);

-- Generate booking references for existing bookings that don't have one
-- Format: BKG-{first 8 chars of booking ID}-{YYYYMMDD}
UPDATE bookings
SET booking_reference = 'BKG-' || SUBSTRING(id::text, 1, 8) || '-' || TO_CHAR(booking_date, 'YYYYMMDD')
WHERE booking_reference IS NULL;

-- Add comment
COMMENT ON COLUMN bookings.booking_reference IS 'Unique booking reference code for ticket verification';

-- Verify the migration
SELECT
  COUNT(*) as total_bookings,
  COUNT(booking_reference) as bookings_with_reference,
  COUNT(*) - COUNT(booking_reference) as bookings_without_reference
FROM bookings;
