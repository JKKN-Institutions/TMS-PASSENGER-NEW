import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkStaff(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Server configuration error');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check if staff exists
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('id, email, staff_name, department, mobile, status')
    .eq('email', email)
    .single();

  if (staffError || !staff) {
    return {
      isStaff: false,
      exists: false,
      message: 'Staff account not found in local database',
      suggestion: 'You may need to create a local staff account or contact administration'
    };
  }

  const isActive = staff.status === 'active';

  return {
    isStaff: true,
    exists: true,
    isActive,
    staff: {
      id: staff.id,
      staff_name: staff.staff_name,
      email: staff.email,
      department: staff.department,
      mobile: staff.mobile,
      status: staff.status
    },
    message: isActive
      ? 'Staff account found and ready for login'
      : 'Staff account exists but is not active'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required', isStaff: false }, { status: 400 });
    }

    const result = await checkStaff(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Check staff GET error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      isStaff: false,
      exists: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required', isStaff: false }, { status: 400 });
    }

    const result = await checkStaff(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Check staff POST error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      isStaff: false,
      exists: false
    }, { status: 500 });
  }
}
