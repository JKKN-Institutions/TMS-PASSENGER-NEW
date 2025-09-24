const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFileUploadDebug() {
  console.log('🔍 Testing file upload to debug screenshot issue...');
  
  try {
    // Create a test image file (similar to what the frontend would send)
    const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA8QWMAAAAAElFTkSuQmCC'; // 1x1 transparent PNG base64
    const buffer = Buffer.from(testImageContent, 'base64');
    const testFile = new File([buffer], 'test-screenshot.png', { type: 'image/png' });
    
    console.log('📁 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    const bugReportId = crypto.randomUUID();
    const fileName = `${crypto.randomUUID()}.png`;
    const filePath = `bug-reports/${bugReportId}/${fileName}`;

    console.log('📤 Attempting upload to:', filePath);

    // Test the exact upload logic from the API
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug-screenshots')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed with error:', uploadError);
      console.error('Error details:', {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        __isStorageError: uploadError.__isStorageError
      });
      
      // Check if it's an RLS policy issue
      if (uploadError.status === 400 || uploadError.message?.includes('row-level security')) {
        console.log('\n🔒 This appears to be an RLS (Row Level Security) policy issue');
        console.log('The storage bucket policies are not allowing file uploads');
      }
      
      return;
    }

    console.log('✅ Upload successful:', uploadData.path);

    // Test getting public URL
    const { data: urlData } = supabase.storage
      .from('bug-screenshots')
      .getPublicUrl(uploadData.path);

    console.log('🔗 Public URL:', urlData.publicUrl);

    // Test if the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl);
      console.log('🌐 URL accessibility test:', response.status, response.statusText);
    } catch (fetchError) {
      console.error('🌐 URL not accessible:', fetchError.message);
    }

    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('bug-screenshots')
      .remove([filePath]);

    if (deleteError) {
      console.log('⚠️ Failed to clean up test file:', deleteError.message);
    } else {
      console.log('🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Also check bucket configuration
async function checkBucketConfig() {
  console.log('\n📁 Checking bucket configuration...');
  
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }
    
    const bugScreenshotsBucket = buckets.find(b => b.name === 'bug-screenshots');
    
    if (!bugScreenshotsBucket) {
      console.log('❌ bug-screenshots bucket not found');
      console.log('Available buckets:', buckets.map(b => b.name));
      return;
    }
    
    console.log('✅ bug-screenshots bucket found');
    console.log('Bucket details:', {
      id: bugScreenshotsBucket.id,
      name: bugScreenshotsBucket.name,
      public: bugScreenshotsBucket.public,
      created_at: bugScreenshotsBucket.created_at,
      updated_at: bugScreenshotsBucket.updated_at
    });
    
  } catch (error) {
    console.error('❌ Bucket check failed:', error);
  }
}

async function runTests() {
  await checkBucketConfig();
  await testFileUploadDebug();
}

runTests().then(() => {
  console.log('\n✅ File upload debug completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
