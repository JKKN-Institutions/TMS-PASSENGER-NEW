// Check enum values in the database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnumValues() {
  console.log('🔍 Checking enum values...');
  
  try {
    // Get existing bug reports to see what values are used
    console.log('\n1. Checking existing bug reports for enum values...');
    const { data: existingReports, error: reportsError } = await supabase
      .from('bug_reports')
      .select('category, priority, status')
      .limit(10);
    
    if (reportsError) {
      console.log('Error fetching reports:', reportsError.message);
    } else {
      console.log('Existing reports:', existingReports);
      
      if (existingReports && existingReports.length > 0) {
        const categories = [...new Set(existingReports.map(r => r.category))];
        const priorities = [...new Set(existingReports.map(r => r.priority))];
        const statuses = [...new Set(existingReports.map(r => r.status))];
        
        console.log('Categories found:', categories);
        console.log('Priorities found:', priorities);
        console.log('Statuses found:', statuses);
      }
    }

    // Try different priority values
    console.log('\n2. Testing different enum values...');
    const testValues = {
      categories: ['ui_bug', 'functional_bug', 'performance_issue', 'crash', 'security_issue', 'feature_request', 'other'],
      priorities: ['low', 'medium', 'high', 'urgent', 'normal'],
      statuses: ['open', 'in_progress', 'resolved', 'closed', 'duplicate', 'wont_fix']
    };

    for (const priority of testValues.priorities) {
      try {
        const testId = 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const { data, error } = await supabase
          .from('bug_reports')
          .insert({
            id: testId,
            title: 'Test Priority: ' + priority,
            description: 'Testing priority value',
            category: 'other',
            priority: priority,
            status: 'open',
            reported_by: '11111111-1111-1111-1111-111111111111', // Use existing admin ID
            reporter_type: 'student',
            reporter_name: 'Test User',
            reporter_email: 'test@example.com'
          })
          .select()
          .single();

        if (error) {
          console.log(`❌ Priority "${priority}" failed:`, error.message);
        } else {
          console.log(`✅ Priority "${priority}" works`);
          // Clean up
          await supabase.from('bug_reports').delete().eq('id', testId);
        }
      } catch (e) {
        console.log(`❌ Priority "${priority}" exception:`, e.message);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkEnumValues().then(() => {
  console.log('\n🏁 Enum check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
