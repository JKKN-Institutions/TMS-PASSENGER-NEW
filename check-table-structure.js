// Check actual table structure
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structures...');
  
  try {
    // Get bug_reports table structure
    console.log('\n1. bug_reports table structure:');
    const { data: bugReportsData, error: bugReportsError } = await supabase
      .from('bug_reports')
      .select('*')
      .limit(1);
    
    if (bugReportsError) {
      console.error('Error:', bugReportsError);
    } else {
      if (bugReportsData && bugReportsData.length > 0) {
        console.log('Columns found:', Object.keys(bugReportsData[0]));
      } else {
        console.log('Table exists but is empty');
      }
    }

    // Try to get table info from information_schema
    console.log('\n2. Getting column information from information_schema:');
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'bug_reports' })
      .catch(() => {
        // If RPC doesn't exist, try a direct query
        return supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'bug_reports')
          .eq('table_schema', 'public');
      });

    if (columnError) {
      console.log('Could not get column info:', columnError.message);
    } else {
      console.log('Column details:', columnInfo);
    }

    // Check what tables actually exist
    console.log('\n3. Checking all available tables:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%bug%');

    if (tablesError) {
      console.log('Could not get table list:', tablesError.message);
    } else {
      console.log('Bug-related tables:', tables?.map(t => t.table_name));
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkTableStructure().then(() => {
  console.log('\n🏁 Table structure check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

