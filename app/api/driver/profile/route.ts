import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    console.log('🔍 Driver profile API called with ID:', driverId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId) {
      console.error('❌ No driverId provided');
      return NextResponse.json({ error: 'driverId is required' }, { status: 400 });
    }

    // First, try to fetch driver profile by ID
    console.log('🔍 Searching for driver by ID:', driverId);
    const { data: profile, error } = await supabase
      .from('drivers')
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
      .eq('id', driverId)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      
      // If the error is "PGRST116" (no rows found), it means the driver doesn't exist
      if (error.code === 'PGRST116') {
        console.log('🔍 Driver not found by ID, checking if any drivers exist...');
        
        // Check if there are any drivers in the table
        const { data: allDrivers, error: countError } = await supabase
          .from('drivers')
          .select('id, name, email')
          .limit(5);
          
        if (countError) {
          console.error('❌ Error checking drivers table:', countError);
          return NextResponse.json({ 
            error: 'Database connection error',
            details: countError.message 
          }, { status: 500 });
        }
        
        console.log('📊 Found drivers in database:', allDrivers?.length || 0);
        if (allDrivers && allDrivers.length > 0) {
          console.log('📋 Available drivers:', allDrivers.map(d => ({ id: d.id, name: d.name, email: d.email })));
        }
        
        // Try to find driver by email as fallback (extract email from auth context if available)
        const emailFromId = searchParams.get('email') || searchParams.get('userEmail');
        if (emailFromId) {
          console.log('🔍 Trying fallback search by email:', emailFromId);
          const { data: profileByEmail, error: emailError } = await supabase
            .from('drivers')
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
            .eq('email', emailFromId)
            .single();
            
          if (!emailError && profileByEmail) {
            console.log('✅ Found driver by email:', profileByEmail.email);
            return NextResponse.json({ 
              success: true, 
              profile: {
                ...profileByEmail,
                rating: profileByEmail.rating || 0,
                total_trips: profileByEmail.total_trips || 0,
                experience_years: profileByEmail.experience_years || 0
              },
              note: 'Profile found by email fallback'
            });
          }
        }
        
        return NextResponse.json({ 
          error: 'Driver not found',
          details: `No driver found with ID: ${driverId}`,
          availableDrivers: allDrivers?.length || 0,
          suggestion: 'The driver ID from authentication does not match any driver in the database. Please contact support to link your account.',
          debugInfo: {
            searchedId: driverId,
            searchedEmail: emailFromId || 'not provided',
            totalDriversInDb: allDrivers?.length || 0
          }
        }, { status: 404 });
      }
      
      // Other database errors
      return NextResponse.json({ 
        error: 'Database error',
        details: error.message 
      }, { status: 500 });
    }

    if (!profile) {
      console.log('⚠️ Profile query succeeded but returned null');
      return NextResponse.json({ 
        error: 'Driver not found',
        details: 'Profile data is null'
      }, { status: 404 });
    }

    console.log('✅ Driver profile found:', { id: profile.id, name: profile.name, email: profile.email });

    return NextResponse.json({ 
      success: true, 
      profile: {
        ...profile,
        rating: profile.rating || 0,
        total_trips: profile.total_trips || 0,
        experience_years: profile.experience_years || 0
      }
    });
  } catch (error) {
    console.error('❌ Driver profile API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: message 
    }, { status: 500 });
  }
}



