const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllocation() {
  const studentEmail = 'student@jkkn.ac.in';
  
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('email', studentEmail)
    .single();
    
  console.log('📊 Student profile:');
  console.log(JSON.stringify(student, null, 2));
  
  console.log('\n📍 Checking allocations...\n');
  
  const { data: allocations } = await supabase
    .from('student_route_allocations')
    .select('*')
    .eq('student_id', student.id);
    
  console.log('All allocations:');
  console.table(allocations);
  
  console.log('\n🔍 Checking students table for allocated_route_id...');
  console.log('allocated_route_id:', student.allocated_route_id);
}

checkAllocation().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
