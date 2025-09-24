const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixStorageBucketIssue() {
  console.log('🔧 Fixing storage bucket issue for screenshots...');
  
  try {
    // Check current buckets
    console.log('📁 Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }
    
    console.log('📂 Existing buckets:', buckets.map(b => b.name));
    
    // Check if bug-screenshots bucket exists
    const bugScreenshotsBucket = buckets.find(b => b.name === 'bug-screenshots');
    
    if (!bugScreenshotsBucket) {
      console.log('🆕 Creating bug-screenshots bucket...');
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('bug-screenshots', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
        
        // Check if it's a permission issue
        if (createError.message?.includes('permission') || createError.message?.includes('unauthorized')) {
          console.log('\n🔑 This requires admin/service role permissions');
          console.log('Please create the bucket manually in Supabase dashboard or use service role key');
        }
        return;
      }
      
      console.log('✅ Bucket created successfully:', newBucket);
    } else {
      console.log('✅ bug-screenshots bucket already exists');
    }
    
    // Test upload with the bucket
    console.log('\n📤 Testing upload after bucket creation/verification...');
    
    const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8QWMAAAAAElFTkSuQmCC';
    const buffer = Buffer.from(testImageContent, 'base64');
    const testFile = new File([buffer], 'test-screenshot.png', { type: 'image/png' });
    
    const testFilePath = `bug-reports/test-${Date.now()}/test.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug-screenshots')
      .upload(testFilePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload still failing:', uploadError);
      
      if (uploadError.message?.includes('row-level security')) {
        console.log('\n🔒 RLS policy issue detected. Creating/updating policies...');
        
        // Try to apply RLS policies (requires admin access)
        try {
          const policySQL = `
            -- Allow public read access to bug-screenshots bucket
            CREATE POLICY "Allow public read access" ON storage.objects 
              FOR SELECT 
              USING (bucket_id = 'bug-screenshots');
            
            -- Allow public insert access to bug-screenshots bucket
            CREATE POLICY "Allow public upload access" ON storage.objects 
              FOR INSERT 
              WITH CHECK (bucket_id = 'bug-screenshots');
          `;
          
          console.log('📝 Applying RLS policies...');
          const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
          
          if (policyError) {
            console.error('❌ Failed to apply policies:', policyError);
            console.log('\n📋 Manual policy creation required:');
            console.log(policySQL);
          } else {
            console.log('✅ RLS policies applied successfully');
          }
          
        } catch (policyError) {
          console.log('\n📋 RLS policies need to be created manually in Supabase dashboard:');
          console.log(`
1. Go to Storage > Policies in Supabase dashboard
2. Create policies for 'bug-screenshots' bucket:
   
   Policy 1 - Read Access:
   - Name: "Allow public read access"
   - Allowed operation: SELECT
   - Target roles: public
   - USING expression: bucket_id = 'bug-screenshots'
   
   Policy 2 - Upload Access:
   - Name: "Allow public upload access"  
   - Allowed operation: INSERT
   - Target roles: public
   - WITH CHECK expression: bucket_id = 'bug-screenshots'
          `);
        }
      }
      
      return;
    }
    
    console.log('✅ Upload successful! Screenshot storage is working.');
    console.log('📁 Uploaded file path:', uploadData.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bug-screenshots')
      .getPublicUrl(uploadData.path);
    
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Test URL accessibility
    try {
      const response = await fetch(urlData.publicUrl);
      console.log('🌐 URL accessibility:', response.status, response.statusText);
    } catch (fetchError) {
      console.log('🌐 URL test failed:', fetchError.message);
    }
    
    // Clean up test file
    await supabase.storage
      .from('bug-screenshots')
      .remove([testFilePath]);
    
    console.log('🧹 Test file cleaned up');
    
  } catch (error) {
    console.error('💥 Fix failed:', error);
  }
}

fixStorageBucketIssue().then(() => {
  console.log('\n✅ Storage bucket fix completed');
  process.exit(0);
}).catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
