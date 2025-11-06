const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNov5() {
  const studentEmail = 'student@jkkn.ac.in';
  
  // Get student
  const { data: student } = await supabase
    .from('students')
    .select('id, allocated_route_id')
    .eq('email', studentEmail)
    .single();
    
  console.log('📊 Student:', student);
  
  // Check schedules for Nov 5
  const { data: nov5Schedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('route_id', student.allocated_route_id)
    .eq('schedule_date', '2025-11-05')
    .maybeSingle();
    
  console.log('\n📅 November 5th Schedule:');
  console.log(JSON.stringify(nov5Schedule, null, 2));
  
  // Check booking
  const { data: nov5Booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('student_id', student.id)
    .eq('trip_date', '2025-11-05')
    .single();
    
  console.log('\n🎫 November 5th Booking:');
  console.log(JSON.stringify(nov5Booking, null, 2));
  
  // Check attendance
  if (nov5Booking) {
    const { data: nov5Attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('booking_id', nov5Booking.id)
      .maybeSingle();
      
    console.log('\n✅ November 5th Attendance:');
    console.log(JSON.stringify(nov5Attendance, null, 2));
  }
  
  // Check what the API would return
  console.log('\n🔍 Testing API endpoint...');
  console.log(`Route ID: ${student.allocated_route_id}`);
  console.log(`Student ID: ${student.id}`);
}

debugNov5().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
