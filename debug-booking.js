const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugwbtzgttqlzzuahdmis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2J0emd0dHFsenp1YWhkbWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYzNDQ1NSwiZXhwIjoyMDUxMjEwNDU1fQ.TWAx8B0vYLMX_jVAoUVJdnqU3oG_QIW3DfaC6tjmDiE';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('\n🔍 Debugging booking and schedule mismatch...\n');

    const studentId = '0a800954-f854-4115-a652-20254478781a';
    const tripDate = '2025-11-03';
    const scheduleId = 'b850f67e-a7a5-4a06-befb-7f94ccf7248b'; // From API response

    // Get the booking
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, schedule_id, trip_date, route_id, qr_code, status')
      .eq('student_id', studentId)
      .eq('trip_date', tripDate)
      .eq('status', 'confirmed');

    if (!bookings || bookings.length === 0) {
      console.log('❌ NO BOOKING FOUND for this student on this date');
      return;
    }

    const booking = bookings[0];
    console.log('✅ Booking found:');
    console.log('   ID:', booking.id);
    console.log('   Schedule ID:', booking.schedule_id);
    console.log('   Trip Date:', booking.trip_date);
    console.log('   Route ID:', booking.route_id);
    console.log('   QR Code:', booking.qr_code);
    console.log('');

    console.log('🔍 Checking if booking matches schedule from API...');
    console.log('   Schedule ID from API:', scheduleId);
    console.log('   Booking schedule_id:', booking.schedule_id);
    console.log('   Match?', booking.schedule_id === scheduleId ? '✅ YES' : '❌ NO');
    console.log('');

    if (booking.schedule_id !== scheduleId) {
      console.log('⚠️ MISMATCH DETECTED!');
      console.log('   The booking has a different schedule_id than what the API returned');
      console.log('   This is why user_booking is null!');
      console.log('');

      // Get the schedule details for both IDs
      const { data: apiSchedule } = await supabase
        .from('schedules')
        .select('id, schedule_date, route_id, status')
        .eq('id', scheduleId)
        .single();

      const { data: bookingSchedule } = await supabase
        .from('schedules')
        .select('id, schedule_date, route_id, status')
        .eq('id', booking.schedule_id)
        .single();

      console.log('📋 API Schedule (what was returned):');
      console.log('   ID:', apiSchedule?.id);
      console.log('   Date:', apiSchedule?.schedule_date);
      console.log('   Route ID:', apiSchedule?.route_id);
      console.log('   Status:', apiSchedule?.status);
      console.log('');

      console.log('📋 Booking Schedule (what booking references):');
      console.log('   ID:', bookingSchedule?.id);
      console.log('   Date:', bookingSchedule?.schedule_date);
      console.log('   Route ID:', bookingSchedule?.route_id);
      console.log('   Status:', bookingSchedule?.status);
      console.log('');

      console.log('🔍 Checking if they match by trip_date + route_id:');
      console.log('   Date match?', apiSchedule?.schedule_date === booking.trip_date ? '✅' : '❌');
      console.log('   Route match?', apiSchedule?.route_id === booking.route_id ? '✅' : '❌');
      console.log('');

      if (apiSchedule?.schedule_date === booking.trip_date && apiSchedule?.route_id === booking.route_id) {
        console.log('✅ SOLUTION: Update API to match by trip_date + route_id');
        console.log('   Our fix should handle this!');
      }
    } else {
      console.log('✅ Schedule IDs match - booking should be found');
      console.log('   Something else is wrong...');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
