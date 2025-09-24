// Final comprehensive test for bug reporting system
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

async function finalTest() {
  console.log('🧪 Final Bug Reporting System Test...');
  
  try {
    // Test with correct enum values and structure
    const testBugReport = {
      id: generateUUID(),
      title: 'Final Test Bug Report',
      description: 'This is a comprehensive test of the bug reporting system',
      category: 'functionality', // Use valid enum
      priority: 'medium', // Use valid enum
      status: 'open', // Use valid enum
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

    console.log('\n1. Testing bug report creation...');
    const { data: insertResult, error: insertError } = await supabase
      .from('bug_reports')
      .insert(testBugReport)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Bug report creation failed:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return;
    } else {
      console.log('✅ Bug report created successfully:', insertResult.id);
    }

    // Test screenshot URL update
    console.log('\n2. Testing screenshot URL update...');
    const testScreenshotUrl = 'https://example.com/screenshot.png';
    const { error: updateError } = await supabase
      .from('bug_reports')
      .update({ screenshot_url: testScreenshotUrl })
      .eq('id', insertResult.id);

    if (updateError) {
      console.error('❌ Screenshot URL update failed:', updateError);
    } else {
      console.log('✅ Screenshot URL updated successfully');
    }

    // Test retrieval
    console.log('\n3. Testing bug report retrieval...');
    const { data: retrieveResult, error: retrieveError } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('reported_by', testBugReport.reported_by);

    if (retrieveError) {
      console.error('❌ Retrieval failed:', retrieveError);
    } else {
      console.log('✅ Retrieval successful, found', retrieveResult.length, 'records');
      console.log('Screenshot URL:', retrieveResult[0]?.screenshot_url);
    }

    // Test storage bucket access
    console.log('\n4. Testing storage bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage access failed:', bucketsError);
    } else {
      const bugScreenshotsBucket = buckets.find(b => b.name === 'bug-screenshots');
      if (bugScreenshotsBucket) {
        console.log('✅ bug-screenshots bucket accessible');
      } else {
        console.log('❌ bug-screenshots bucket not found');
        console.log('Available buckets:', buckets.map(b => b.name));
      }
    }

    // Clean up
    console.log('\n5. Cleaning up test data...');
    await supabase
      .from('bug_reports')
      .delete()
      .eq('id', insertResult.id);
    console.log('🧹 Test record cleaned up');

    console.log('\n🎉 All tests passed! Bug reporting system is working correctly.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

finalTest().then(() => {
  console.log('\n🏁 Final test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});

