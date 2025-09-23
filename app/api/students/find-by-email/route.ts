import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use service role key if available (bypasses RLS), otherwise use anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    const keyType = supabaseServiceKey ? 'service_role' : 'anon';
    
    console.log(`🔑 Finding student by email using Supabase key type: ${keyType}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try to find the student by email
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Student not found
        console.log('📭 No student found with email:', email);
        return NextResponse.json({
          success: false,
          message: 'Student not found',
          student: null
        });
      }
      
      console.error('❌ Error finding student by email:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found',
        student: null
      });
    }

    console.log('✅ Found student by email:', {
      id: student.id,
      email: student.email,
      rollNumber: student.roll_number,
      externalStudentId: student.external_student_id
    });

    return NextResponse.json({
      success: true,
      student: student
    });

  } catch (error) {
    console.error('Error in find student by email API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
