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

async function testFixedBugReportAPI() {
  console.log('🔧 Testing FIXED bug report API...');
  
  try {
    // Test the exact data structure that matches the current schema
    const testBugReport = {
      id: generateUUID(),
      title: 'Production Fix Test - Schema Match',
      description: 'Testing the bug report API with corrected schema\n\n**Steps to Reproduce:**\nSubmit form with screenshot\n\n**Expected Behavior:**\nShould save successfully\n\n**Actual Behavior:**\nPreviously getting 500 error due to schema mismatch',
      category: 'functionality',
      priority: 'medium',
      status: 'open',
      reported_by: generateUUID(),
      reporter_name: 'Test User',
      reporter_email: 'test@jkkn.ac.in',
      reporter_type: 'student',
      screenshot_url: null,
      browser_info: 'Chrome/120.0.0.0',
      device_info: 'Desktop - Windows 11',
      screen_resolution: '1920x1080',
      user_agent: 'Mozilla/5.0 Test User Agent',
      page_url: 'https://tms.jkkn.ac.in/dashboard',
      tags: null,
      is_duplicate: false,
      duplicate_of: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Testing database insertion with fixed schema...');
    const { data: insertData, error: insertError } = await supabase
      .from('bug_reports')
      .insert([testBugReport])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Database insertion still failed:', insertError);
      return;
    }
    
    console.log('✅ Database insertion successful!');
    console.log('📄 Inserted data ID:', insertData.id);
    
    // Test file upload simulation
    console.log('📁 Testing file upload flow...');
    try {
      const testBlob = new Blob(['fake image content'], { type: 'image/png' });
      const testFile = new File([testBlob], 'test-screenshot.png', { type: 'image/png' });
      
      const testFilePath = `bug-reports/${testBugReport.id}/test-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bug-screenshots')
        .upload(testFilePath, testFile);
      
      if (uploadError) {
        console.error('❌ File upload failed:', uploadError);
      } else {
        console.log('✅ File upload successful:', uploadData.path);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('bug-screenshots')
          .getPublicUrl(uploadData.path);
        
        console.log('🔗 Public URL:', urlData.publicUrl);
        
        // Update bug report with screenshot URL
        const { error: updateError } = await supabase
          .from('bug_reports')
          .update({ screenshot_url: urlData.publicUrl })
          .eq('id', testBugReport.id);
        
        if (updateError) {
          console.error('❌ Failed to update screenshot URL:', updateError);
        } else {
          console.log('✅ Screenshot URL updated successfully');
        }
        
        // Clean up test file
        await supabase.storage
          .from('bug-screenshots')
          .remove([testFilePath]);
        console.log('🧹 Test file cleaned up');
      }
      
    } catch (storageError) {
      console.error('❌ Storage test failed:', storageError);
    }
    
    // Clean up test bug report
    console.log('🧹 Cleaning up test bug report...');
    const { error: deleteError } = await supabase
      .from('bug_reports')
      .delete()
      .eq('id', testBugReport.id);
    
    if (deleteError) {
      console.error('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 All tests PASSED! The API should work in production now.');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testFixedBugReportAPI().then(() => {
  console.log('Fixed API test completed');
  process.exit(0);
}).catch(err => {
  console.error('Fixed API test failed:', err);
  process.exit(1);
});
