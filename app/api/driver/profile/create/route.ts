import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, email, name } = body;

    console.log('🔍 Create driver profile API called:', { driverId, email, name });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId || !email) {
      console.error('❌ Missing required fields:', { driverId, email });
      return NextResponse.json({ 
        error: 'Driver ID and email are required' 
      }, { status: 400 });
    }

    // Check if driver already exists
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id, name, email')
      .eq('id', driverId)
      .single();

    if (!checkError && existingDriver) {
      console.log('✅ Driver already exists:', existingDriver);
      return NextResponse.json({ 
        success: true,
        message: 'Driver profile already exists',
        profile: existingDriver
      });
    }

    // Check if a driver with this email already exists
    const { data: existingByEmail, error: emailCheckError } = await supabase
      .from('drivers')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!emailCheckError && existingByEmail) {
      console.log('⚠️ Driver with this email already exists:', existingByEmail);
      return NextResponse.json({ 
        error: 'A driver with this email already exists',
        existingDriver: existingByEmail,
        suggestion: 'Please contact support to link your account with the existing driver profile'
      }, { status: 409 });
    }

    // Create new driver profile
    const newDriverData = {
      id: driverId,
      name: name || 'Driver',
      email: email,
      phone: '',
      license_number: '',
      experience_years: 0,
      rating: 0,
      total_trips: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔄 Creating new driver profile:', newDriverData);

    const { data: newDriver, error: createError } = await supabase
      .from('drivers')
      .insert([newDriverData])
      .select(`
        id,
        name,
        email,
        phone,
        license_number,
        experience_years,
        rating,
        total_trips,
        status,
        created_at
      `)
      .single();

    if (createError) {
      console.error('❌ Error creating driver profile:', createError);
      return NextResponse.json({ 
        error: 'Failed to create driver profile',
        details: createError.message 
      }, { status: 500 });
    }

    console.log('✅ Driver profile created successfully:', newDriver);

    return NextResponse.json({ 
      success: true,
      message: 'Driver profile created successfully',
      profile: {
        ...newDriver,
        rating: newDriver.rating || 0,
        total_trips: newDriver.total_trips || 0,
        experience_years: newDriver.experience_years || 0
      }
    });

  } catch (error) {
    console.error('❌ Create driver profile API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: message 
    }, { status: 500 });
  }
}

