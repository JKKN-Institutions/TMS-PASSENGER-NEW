const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBugReports() {
  console.log('🔍 Checking for bug reports in database...');
  
  try {
    const { data, error, count } = await supabase
      .from('bug_reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching bug reports:', error);
      return;
    }
    
    console.log('📊 Total bug reports found:', count);
    
    if (data && data.length > 0) {
      console.log('\n📋 Recent bug reports:');
      data.slice(0, 10).forEach((bug, index) => {
        console.log(`${index + 1}. ID: ${bug.id}`);
        console.log(`   Title: ${bug.title}`);
        console.log(`   Status: ${bug.status}`);
        console.log(`   Category: ${bug.category}`);
        console.log(`   Priority: ${bug.priority}`);
        console.log(`   Reporter: ${bug.reporter_email}`);
        console.log(`   Created: ${bug.created_at}`);
        console.log(`   Screenshot: ${bug.screenshot_url ? 'Yes' : 'No'}`);
        if (bug.screenshot_url) {
          console.log(`   Screenshot URL: ${bug.screenshot_url}`);
        }
        console.log('   ---');
      });
    } else {
      console.log('📝 No bug reports found in database');
    }
    
  } catch (error) {
    console.error('❌ Database query failed:', error);
  }
}

checkBugReports().then(() => {
  console.log('✅ Bug report check completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
