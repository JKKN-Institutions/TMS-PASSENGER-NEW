// Database diagnostic script for bug reporting system
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking bug reporting database structure...');
  
  try {
    // Check if bug_reports table exists
    console.log('\n1. Checking bug_reports table...');
    const { data: bugReportsCheck, error: bugReportsError } = await supabase
      .from('bug_reports')
      .select('*')
      .limit(1);
    
    if (bugReportsError) {
      console.error('❌ bug_reports table error:', bugReportsError);
    } else {
      console.log('✅ bug_reports table exists');
    }

    // Check if bug_attachments table exists
    console.log('\n2. Checking bug_attachments table...');
    const { data: attachmentsCheck, error: attachmentsError } = await supabase
      .from('bug_attachments')
      .select('*')
      .limit(1);
    
    if (attachmentsError) {
      console.error('❌ bug_attachments table error:', attachmentsError);
    } else {
      console.log('✅ bug_attachments table exists');
    }

    // Check if bug_comments table exists
    console.log('\n3. Checking bug_comments table...');
    const { data: commentsCheck, error: commentsError } = await supabase
      .from('bug_comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ bug_comments table error:', commentsError);
    } else {
      console.log('✅ bug_comments table exists');
    }

    // Check if admin_users table exists (required for foreign key)
    console.log('\n4. Checking admin_users table...');
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('id, name, email')
      .limit(1);
    
    if (adminError) {
      console.error('❌ admin_users table error:', adminError);
    } else {
      console.log('✅ admin_users table exists');
      console.log('Sample admin user:', adminCheck?.[0]);
    }

    // Check storage bucket
    console.log('\n5. Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError);
    } else {
      const bugAttachmentsBucket = buckets.find(b => b.name === 'bug-attachments');
      if (bugAttachmentsBucket) {
        console.log('✅ bug-attachments bucket exists');
      } else {
        console.error('❌ bug-attachments bucket not found');
        console.log('Available buckets:', buckets.map(b => b.name));
      }
    }

    // Test a simple insert to identify the exact error
    console.log('\n6. Testing bug report insertion...');
    const testBugReport = {
      id: 'test-' + Date.now(),
      title: 'Test Bug Report',
      description: 'This is a test bug report to check database connectivity',
      category: 'other',
      severity: 'medium',
      priority: 'normal',
      status: 'open',
      reporter_type: 'student',
      reporter_id: 'test-user-id',
      reporter_name: 'Test User',
      reporter_email: 'test@example.com',
      browser_info: JSON.stringify({ test: true }),
      device_info: JSON.stringify({ test: true }),
      screen_resolution: '1920x1080',
      user_agent: 'Test User Agent',
      page_url: 'https://test.example.com'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('bug_reports')
      .insert(testBugReport)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test insertion failed:', insertError);
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Test insertion successful:', insertResult.id);
      
      // Clean up test record
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

// Run the check
checkDatabase().then(() => {
  console.log('\n🏁 Database check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
