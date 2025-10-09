import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkDriver(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Server configuration error');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Check if driver exists
  const { data: driver, error: driverError } = await supabaseAdmin
    .from('drivers')
    .select('id, email, name, phone, status, password_hash, assigned_route_id')
    .eq('email', email)
    .single();

  if (driverError || !driver) {
    return {
      isDriver: false,
      exists: false,
      message: 'Driver account not found in local database',
      suggestion: 'You may need to create a local driver account or contact administration'
    };
  }

  const hasPassword = !!driver.password_hash;
  const isActive = driver.status === 'active';

  return {
    isDriver: true,
    exists: true,
    hasPassword,
    isActive,
    driver: {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      assigned_route_id: driver.assigned_route_id
    },
    message: hasPassword && isActive 
      ? 'Driver account found and ready for login' 
      : !hasPassword 
        ? 'Driver account exists but password not set'
        : 'Driver account exists but is not active'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required', isDriver: false }, { status: 400 });
    }

    const result = await checkDriver(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Check driver GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isDriver: false,
      exists: false 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required', isDriver: false }, { status: 400 });
    }

    const result = await checkDriver(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Check driver POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      isDriver: false,
      exists: false 
    }, { status: 500 });
  }
}
