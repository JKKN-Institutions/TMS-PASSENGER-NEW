// Test the bug reports API
const { createClient } = require('@supabase/supabase-js');

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBugReportAPI() {
  console.log('🧪 Testing bug report API...');
  
  try {
    // Test data that matches the actual table structure
    const testBugReport = {
      id: generateUUID(),
      title: 'Test Bug Report',
      description: 'This is a test bug report',
      category: 'other',
      priority: 'normal',
      status: 'open',
      reported_by: generateUUID(),
      reporter_type: 'student',
      reporter_name: 'Test User',
      reporter_email: 'test@example.com',
      browser_info: JSON.stringify({ browser: 'Chrome', version: '120' }),
      device_info: JSON.stringify({ platform: 'Windows', language: 'en' }),
      screen_resolution: '1920x1080',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      page_url: 'https://test.example.com'
    };

    console.log('\n1. Testing direct database insertion...');
    const { data: insertResult, error: insertError } = await supabase
      .from('bug_reports')
      .insert(testBugReport)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Direct insertion failed:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Direct insertion successful:', insertResult.id);
      
      // Test retrieval
      console.log('\n2. Testing retrieval...');
      const { data: retrieveResult, error: retrieveError } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('reported_by', testBugReport.reported_by);

      if (retrieveError) {
        console.error('❌ Retrieval failed:', retrieveError);
      } else {
        console.log('✅ Retrieval successful, found', retrieveResult.length, 'records');
      }
      
      // Clean up
      console.log('\n3. Cleaning up test data...');
      await supabase
        .from('bug_reports')
        .delete()
        .eq('id', insertResult.id);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testBugReportAPI().then(() => {
  console.log('\n🏁 API test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
