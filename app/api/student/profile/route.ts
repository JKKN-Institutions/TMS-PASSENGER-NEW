import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Fetch complete student profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const email = searchParams.get('email');

    if (!studentId && !email) {
      return NextResponse.json({ error: 'Student ID or email is required' }, { status: 400 });
    }

    // Build query based on available parameters
    let query = supabase
      .from('students')
      .select(`
        *,
        quota_type:quota_types(
          id,
          quota_name,
          quota_code,
          description,
          annual_fee_amount,
          is_government_quota
        )
      `);

    // Use studentId if available, otherwise use email
    if (studentId) {
      query = query.eq('id', studentId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: student, error } = await query.single();

    if (error) {
      console.error('Error fetching student profile:', error);
      // If student not found by ID, try by email as fallback
      if (studentId && !email && error.code === 'PGRST116') {
        console.log('🔄 Student not found by ID, trying fallback by user context...');
        return NextResponse.json({ 
          error: 'Student not found by ID. Please provide email as fallback.' 
        }, { status: 404 });
      }
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Transform and return the detailed profile data
    const profileData = {
      // Basic Information
      id: student.id,
      student_name: student.student_name,
      roll_number: student.roll_number,
      email: student.email,
      mobile: student.mobile,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      
      // Academic Information
      institution_name: student.institution_name,
      department_name: student.department_name,
      program_name: student.program_name,
      degree_name: student.degree_name,
      
      // Family Information
      father_name: student.father_name,
      father_mobile: student.father_mobile,
      mother_name: student.mother_name,
      mother_mobile: student.mother_mobile,
      
      // Emergency Contact
      emergency_contact_name: student.emergency_contact_name,
      emergency_contact_phone: student.emergency_contact_phone,
      
      // Address Information
      address_street: student.address_street,
      address_district: student.address_district,
      address_state: student.address_state,
      address_pin_code: student.address_pin_code,
      
      // Transport Information
      allocated_route_id: student.allocated_route_id,
      boarding_point: student.boarding_point,
      transport_status: student.transport_status,
      transport_enrolled: student.transport_enrolled,
      payment_status: student.payment_status,
      outstanding_amount: student.outstanding_amount,
      
      // Quota Information
      quota_type: student.quota_type,
      transport_fee_amount: student.transport_fee_amount,
      
      // Profile Status
      is_profile_complete: student.is_profile_complete,
      profile_completion_percentage: student.profile_completion_percentage || 0,
      
      // Timestamps
      created_at: student.created_at,
      updated_at: student.updated_at
    };

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error: any) {
    console.error('Error in student profile GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update student profile (editable fields only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, updates } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Define which fields are editable (exclude name and email)
    const editableFields = [
      'mobile',
      'roll_number',
      'emergency_contact_name',
      'emergency_contact_phone',
      'father_mobile',
      'mother_mobile',
      'address_street',
      'address_district',
      'address_state',
      'address_pin_code'
    ];

    // Filter updates to only include editable fields
    const filteredUpdates: any = {};
    editableFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Add updated timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    // Trim all string values to prevent empty spaces
    Object.keys(filteredUpdates).forEach(key => {
      if (typeof filteredUpdates[key] === 'string') {
        filteredUpdates[key] = filteredUpdates[key].trim();
      }
    });

    // Enhanced validation with specific field error messages
    const validationErrors: Record<string, string> = {};

    // Validate phone numbers
    if (filteredUpdates.mobile && !/^[6-9]\d{9}$/.test(filteredUpdates.mobile)) {
      validationErrors.mobile = 'Mobile number must be a 10-digit Indian number starting with 6-9';
    }

    if (filteredUpdates.emergency_contact_phone && !/^[6-9]\d{9}$/.test(filteredUpdates.emergency_contact_phone)) {
      validationErrors.emergency_contact_phone = 'Emergency contact phone must be a 10-digit Indian number starting with 6-9';
    }

    if (filteredUpdates.father_mobile && !/^[6-9]\d{9}$/.test(filteredUpdates.father_mobile)) {
      validationErrors.father_mobile = 'Father\'s mobile must be a 10-digit Indian number starting with 6-9';
    }

    if (filteredUpdates.mother_mobile && !/^[6-9]\d{9}$/.test(filteredUpdates.mother_mobile)) {
      validationErrors.mother_mobile = 'Mother\'s mobile must be a 10-digit Indian number starting with 6-9';
    }

    // Validate PIN code
    if (filteredUpdates.address_pin_code && !/^\d{6}$/.test(filteredUpdates.address_pin_code)) {
      validationErrors.address_pin_code = 'PIN code must be exactly 6 digits';
    }

    // Validate text fields with minimum length
    if (filteredUpdates.emergency_contact_name && filteredUpdates.emergency_contact_name.trim().length < 2) {
      validationErrors.emergency_contact_name = 'Emergency contact name must be at least 2 characters';
    }

    if (filteredUpdates.roll_number && filteredUpdates.roll_number.trim().length < 3) {
      validationErrors.roll_number = 'Roll number must be at least 3 characters';
    }

    if (filteredUpdates.address_street && filteredUpdates.address_street.trim().length < 5) {
      validationErrors.address_street = 'Street address must be at least 5 characters';
    }

    if (filteredUpdates.address_district && filteredUpdates.address_district.trim().length < 2) {
      validationErrors.address_district = 'District must be at least 2 characters';
    }

    if (filteredUpdates.address_state && filteredUpdates.address_state.trim().length < 2) {
      validationErrors.address_state = 'State must be at least 2 characters';
    }

    // If there are validation errors, return them
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        validationErrors,
        details: 'Please fix the validation errors and try again'
      }, { status: 400 });
    }

    // Update the student profile
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update(filteredUpdates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating student profile:', error);
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message 
      }, { status: 500 });
    }

    // Calculate and update profile completion percentage
    if (updatedStudent) {
      const profileFields = [
        updatedStudent.mobile,
        updatedStudent.emergency_contact_name,
        updatedStudent.emergency_contact_phone,
        updatedStudent.address_street,
        updatedStudent.address_district,
        updatedStudent.address_state,
        updatedStudent.address_pin_code
      ];
      
      const completedFields = profileFields.filter(field => field && field.trim() !== '').length;
      const completionPercentage = Math.round((completedFields / profileFields.length) * 100);
      
      // Update completion percentage
      await supabase
        .from('students')
        .update({ 
          profile_completion_percentage: completionPercentage,
          is_profile_complete: completionPercentage >= 85
        })
        .eq('id', studentId);
        
      updatedStudent.profile_completion_percentage = completionPercentage;
      updatedStudent.is_profile_complete = completionPercentage >= 85;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedStudent
    });

  } catch (error: any) {
    console.error('Error in student profile PUT:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
