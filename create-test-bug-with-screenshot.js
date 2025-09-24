const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestBugWithScreenshot() {
  console.log('🧪 Creating a test bug report with screenshot to verify the full flow...');
  
  try {
    // Create a proper test image (base64 encoded PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QwNEgkTGm7MwAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABHSURBVBjTY/z//z8DKYAx+P//P8aQBXgYSAS9vb2HDYoQBv/+/Rv9DwUYIhcaBhIBVZpLmgLaLYRZ8J9hCAJUCiRSAAABCgATGp8NAAAAAElFTkSuQmCC';
    const buffer = Buffer.from(testImageBase64, 'base64');
    const testFile = new File([buffer], 'test-bug-screenshot.png', { type: 'image/png' });

    console.log('📸 Created test screenshot file:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Generate IDs
    const bugReportId = crypto.randomUUID();
    const reportedBy = crypto.randomUUID();

    // Step 1: Upload screenshot first
    const fileName = `${crypto.randomUUID()}.png`;
    const filePath = `bug-reports/${bugReportId}/${fileName}`;

    console.log('📤 Uploading screenshot to:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug-screenshots')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Screenshot upload failed:', uploadError);
      return;
    }

    console.log('✅ Screenshot uploaded successfully:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bug-screenshots')
      .getPublicUrl(uploadData.path);

    const screenshotUrl = urlData.publicUrl;
    console.log('🔗 Screenshot URL:', screenshotUrl);

    // Step 2: Create bug report with screenshot URL
    const testBugReport = {
      id: bugReportId,
      title: 'Test Bug With Screenshot - ' + new Date().toLocaleTimeString(),
      description: 'This is a test bug report created via script to verify screenshot storage.\n\n**Steps to Reproduce:**\n1. Run the test script\n2. Check admin panel\n\n**Expected Behavior:**\nScreenshot should be visible in admin panel\n\n**Actual Behavior:**\nTesting to see if screenshot appears',
      category: 'functionality',
      priority: 'medium',
      status: 'open',
      reported_by: reportedBy,
      reporter_name: 'Test Script User',
      reporter_email: 'script@test.com',
      reporter_type: 'student',
      screenshot_url: screenshotUrl,
      browser_info: 'Node.js Test Script',
      device_info: 'Test Environment',
      screen_resolution: '1920x1080',
      user_agent: 'Test Script User Agent',
      page_url: 'http://localhost:3000/test',
      tags: null,
      is_duplicate: false,
      duplicate_of: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Creating bug report in database...');

    const { data: bugData, error: bugError } = await supabase
      .from('bug_reports')
      .insert([testBugReport])
      .select()
      .single();

    if (bugError) {
      console.error('❌ Bug report creation failed:', bugError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('bug-screenshots')
        .remove([filePath]);
      return;
    }

    console.log('✅ Bug report created successfully!');
    console.log('📋 Bug report details:');
    console.log('   ID:', bugData.id);
    console.log('   Title:', bugData.title);
    console.log('   Screenshot URL:', bugData.screenshot_url);
    console.log('   Created:', bugData.created_at);

    // Verify the screenshot URL is accessible
    console.log('\n🌐 Testing screenshot URL accessibility...');
    try {
      const response = await fetch(screenshotUrl);
      console.log('   Status:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Screenshot is accessible via public URL');
      } else {
        console.log('❌ Screenshot URL returned error:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Failed to fetch screenshot URL:', fetchError.message);
    }

    console.log('\n📨 You should now see this bug report in the admin panel with a screenshot!');
    console.log('🔗 Screenshot URL for manual testing:', screenshotUrl);

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

createTestBugWithScreenshot().then(() => {
  console.log('\n✅ Test bug creation completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
