const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBugReportsSchema() {
  console.log('🔍 Checking bug_reports table schema...');
  
  try {
    // Get one existing row to see actual column structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('bug_reports')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Available columns in bug_reports:');
      const columns = Object.keys(sampleData[0]);
      columns.sort().forEach(col => {
        console.log(`  - ${col}`);
      });
      
      console.log('\n📄 Sample data structure:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('No existing data found in bug_reports table');
      
      // Try to insert a minimal record to see what columns are required
      console.log('🧪 Testing minimal insert to discover schema...');
      
      const testData = {
        id: crypto.randomUUID(),
        title: 'Schema Test',
        description: 'Testing to discover schema'
      };
      
      const { data, error } = await supabase
        .from('bug_reports')
        .insert([testData])
        .select();
      
      if (error) {
        console.log('Schema discovery error:', error.message);
      } else {
        console.log('Minimal insert successful, columns:', Object.keys(data[0]));
        
        // Clean up
        await supabase
          .from('bug_reports')
          .delete()
          .eq('id', testData.id);
      }
    }
    
  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkBugReportsSchema().then(() => {
  console.log('Schema check completed');
  process.exit(0);
}).catch(err => {
  console.error('Schema check failed:', err);
  process.exit(1);
});
