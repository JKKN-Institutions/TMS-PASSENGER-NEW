const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Custom UUID generator for testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testBugReportAPI() {
  console.log('🔧 Testing bug report API functionality...');
  
  try {
    // Check if bug_reports table exists and is accessible
    console.log('📊 Checking bug_reports table...');
    const { data: existingReports, error: fetchError } = await supabase
      .from('bug_reports')
      .select('id, title, status')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching from bug_reports:', fetchError);
      return;
    }
    
    console.log('✅ Table accessible, found', existingReports?.length || 0, 'existing reports');
    
    // Test insert with minimal data (similar to production error)
    const testBugReport = {
      id: generateUUID(),
      title: 'Test Bug Report - Production Debug',
      description: 'Testing production API issues',
      steps_to_reproduce: 'Submit form with screenshot',
      expected_behavior: 'Should save successfully',
      actual_behavior: 'Getting 500 error',
      category: 'functionality',
      priority: 'medium',
      status: 'open',
      reported_by: generateUUID(),
      reporter_name: 'Test User',
      reporter_email: 'test@jkkn.ac.in',
      reporter_type: 'student',
      screenshot_url: null,
      browser_info: 'Chrome/120.0.0.0',
      screen_resolution: '1920x1080',
      user_agent: 'Mozilla/5.0 Test',
      page_url: 'https://tms.jkkn.ac.in/dashboard',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Testing database insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('bug_reports')
      .insert([testBugReport])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Database insertion failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return;
    }
    
    console.log('✅ Database insertion successful:', insertData.id);
    
    // Test screenshot storage bucket
    console.log('📁 Testing screenshot storage bucket...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError);
      } else {
        const bugScreenshotsBucket = buckets.find(b => b.name === 'bug-screenshots');
        console.log('📁 bug-screenshots bucket exists:', !!bugScreenshotsBucket);
      }
      
      // Test a small file upload
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const testFilePath = `bug-reports/${testBugReport.id}/test-${Date.now()}.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bug-screenshots')
        .upload(testFilePath, testFile);
      
      if (uploadError) {
        console.error('❌ Test file upload failed:', uploadError);
      } else {
        console.log('✅ Test file upload successful:', uploadData.path);
        
        // Clean up test file
        await supabase.storage
          .from('bug-screenshots')
          .remove([testFilePath]);
      }
      
    } catch (storageError) {
      console.error('❌ Storage test failed:', storageError);
    }
    
    // Clean up test bug report
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('bug_reports')
      .delete()
      .eq('id', testBugReport.id);
    
    if (deleteError) {
      console.error('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Check environment variables
console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

testBugReportAPI().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
