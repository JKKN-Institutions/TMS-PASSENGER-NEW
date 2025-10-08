#!/usr/bin/env node

/**
 * Authentication Setup Verification Script
 * Tests that all authentication files are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ═══════════════════════════════════════════════════════');
console.log('   Authentication Setup Verification');
console.log('═══════════════════════════════════════════════════════\n');

let allChecksPassed = true;

// Test 1: Check environment variables
console.log('📋 Test 1: Environment Variables');
console.log('─────────────────────────────────────────────────────────');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_AUTH_SERVER_URL',
    'NEXT_PUBLIC_APP_ID',
    'API_KEY',
    'NEXT_PUBLIC_REDIRECT_URI',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let envCheckPassed = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      // Extract value
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1].trim() && !match[1].startsWith('#')) {
        console.log(`  ✅ ${varName}`);
      } else {
        console.log(`  ❌ ${varName} - Not set or commented out`);
        envCheckPassed = false;
      }
    } else {
      console.log(`  ❌ ${varName} - Missing`);
      envCheckPassed = false;
    }
  });
  
  if (envCheckPassed) {
    console.log('\n  ✅ All environment variables configured\n');
  } else {
    console.log('\n  ❌ Some environment variables missing or misconfigured\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ .env.local file not found\n');
  allChecksPassed = false;
}

// Test 2: Check critical authentication files
console.log('📋 Test 2: Authentication Files');
console.log('─────────────────────────────────────────────────────────');

const criticalFiles = [
  'lib/auth/auth-context.tsx',
  'lib/auth/parent-auth-service.ts',
  'lib/auth/unified-auth-service.ts',
  'lib/auth/parent-app-integration.ts',
  'app/api/auth/token/route.ts',
  'app/api/auth/validate/route.ts',
  'app/auth/callback/page.tsx'
];

let filesCheckPassed = true;
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`  ❌ ${file} - Missing`);
    filesCheckPassed = false;
  }
});

if (filesCheckPassed) {
  console.log('\n  ✅ All authentication files present\n');
} else {
  console.log('\n  ❌ Some authentication files missing\n');
  allChecksPassed = false;
}

// Test 3: Check auth-context.tsx for enhancement logic
console.log('📋 Test 3: User Enhancement Logic');
console.log('─────────────────────────────────────────────────────────');

const authContextPath = path.join(__dirname, 'lib/auth/auth-context.tsx');
if (fs.existsSync(authContextPath)) {
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  const checks = [
    {
      name: 'ParentAppIntegrationService import',
      pattern: /import.*ParentAppIntegrationService.*from.*parent-app-integration/,
      message: 'Import statement for ParentAppIntegrationService'
    },
    {
      name: 'findOrCreateStudentFromParentApp call',
      pattern: /findOrCreateStudentFromParentApp/,
      message: 'Call to findOrCreateStudentFromParentApp method'
    },
    {
      name: 'studentId assignment',
      pattern: /studentId:\s*student\.id/,
      message: 'Assignment of studentId from database'
    },
    {
      name: 'rollNumber assignment',
      pattern: /rollNumber:\s*student\.roll_number/,
      message: 'Assignment of rollNumber from database'
    },
    {
      name: 'Enhancement logging',
      pattern: /Passenger user needs database enhancement/,
      message: 'Enhancement logging for debugging'
    }
  ];
  
  let enhancementCheckPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(authContextContent)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - Not found`);
      console.log(`     Expected: ${check.message}`);
      enhancementCheckPassed = false;
    }
  });
  
  if (enhancementCheckPassed) {
    console.log('\n  ✅ User enhancement logic properly implemented\n');
  } else {
    console.log('\n  ❌ User enhancement logic incomplete\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ auth-context.tsx not found\n');
  allChecksPassed = false;
}

// Test 4: Check ParentAppUser interface
console.log('📋 Test 4: ParentAppUser Interface');
console.log('─────────────────────────────────────────────────────────');

const parentAuthServicePath = path.join(__dirname, 'lib/auth/parent-auth-service.ts');
if (fs.existsSync(parentAuthServicePath)) {
  const parentAuthServiceContent = fs.readFileSync(parentAuthServicePath, 'utf8');
  
  const interfaceFields = [
    'studentId?:',
    'rollNumber?:',
    'isNewStudent?:',
    'departmentId?:',
    'programId?:',
    'profileCompletionPercentage?:',
    'transportEnrolled?:',
    'enrollmentStatus?:'
  ];
  
  let interfaceCheckPassed = true;
  interfaceFields.forEach(field => {
    if (parentAuthServiceContent.includes(field)) {
      console.log(`  ✅ ${field.replace('?:', '')} (optional field)`);
    } else {
      console.log(`  ❌ ${field.replace('?:', '')} - Missing from interface`);
      interfaceCheckPassed = false;
    }
  });
  
  if (interfaceCheckPassed) {
    console.log('\n  ✅ ParentAppUser interface includes all required fields\n');
  } else {
    console.log('\n  ❌ ParentAppUser interface incomplete\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ parent-auth-service.ts not found\n');
  allChecksPassed = false;
}

// Test 5: Check callback page token storage
console.log('📋 Test 5: Callback Page Token Storage');
console.log('─────────────────────────────────────────────────────────');

const callbackPagePath = path.join(__dirname, 'app/auth/callback/page.tsx');
if (fs.existsSync(callbackPagePath)) {
  const callbackPageContent = fs.readFileSync(callbackPagePath, 'utf8');
  
  const storageChecks = [
    {
      name: 'tms_access_token storage',
      pattern: /localStorage\.setItem\(['"]tms_access_token['"]/
    },
    {
      name: 'tms_refresh_token storage',
      pattern: /localStorage\.setItem\(['"]tms_refresh_token['"]/
    },
    {
      name: 'tms_user storage',
      pattern: /localStorage\.setItem\(['"]tms_user['"]/
    },
    {
      name: 'Cookie storage',
      pattern: /document\.cookie.*tms_access_token/
    },
    {
      name: 'window.location.href redirect',
      pattern: /window\.location\.href\s*=/
    }
  ];
  
  let callbackCheckPassed = true;
  storageChecks.forEach(check => {
    if (check.pattern.test(callbackPageContent)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - Not implemented`);
      callbackCheckPassed = false;
    }
  });
  
  if (callbackCheckPassed) {
    console.log('\n  ✅ Callback page properly stores tokens and redirects\n');
  } else {
    console.log('\n  ❌ Callback page token storage incomplete\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ callback/page.tsx not found\n');
  allChecksPassed = false;
}

// Final Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log('   Verification Summary');
console.log('═══════════════════════════════════════════════════════\n');

if (allChecksPassed) {
  console.log('  ✅ All authentication setup checks passed!');
  console.log('  🚀 Ready to test authentication flow\n');
  console.log('  Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3003');
  console.log('  3. Follow: AUTHENTICATION_TEST_GUIDE.md\n');
  process.exit(0);
} else {
  console.log('  ❌ Some authentication setup checks failed');
  console.log('  🔧 Please review the issues above\n');
  console.log('  Recommendations:');
  console.log('  1. Check missing files or configurations');
  console.log('  2. Verify .env.local has all required variables');
  console.log('  3. Review AUTH_DATABASE_INTEGRATION_FIX.md\n');
  process.exit(1);
}

