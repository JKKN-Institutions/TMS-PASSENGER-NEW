import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, app_id, api_key } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate app credentials
    const expectedAppId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const expectedApiKey = process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a';

    if (app_id !== expectedAppId || api_key !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Invalid app credentials' },
        { status: 401 }
      );
    }

    console.log('Staff direct login attempt:', { email, hasPassword: !!password });

    // Try to authenticate with parent app first
    let parentUser = null;
    let useParentAuth = false;

    try {
      console.log('🔄 Attempting staff authentication with parent app...');

      const parentAuthResponse = await fetch(
        `${process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': expectedApiKey,
            'User-Agent': 'TMS-Staff-App/1.0'
          },
          body: JSON.stringify({
            email,
            password,
            app_id: expectedAppId
          }),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (parentAuthResponse.ok) {
        const parentData = await parentAuthResponse.json();
        parentUser = parentData.user;

        // Enhanced role debugging for staff direct login
        console.log('🔍 Staff Direct Login - Detailed user info from parent app:', {
          email: parentUser?.email,
          role: parentUser?.role,
          fullName: parentUser?.full_name,
          permissions: parentUser?.permissions,
          is_staff: parentUser?.is_staff,
          is_super_admin: parentUser?.is_super_admin,
          allUserData: parentUser
        });

        // Validate that the authenticated user has staff role - enhanced checking
        const hasStaffRole = parentUser && (
          parentUser.role === 'staff' ||
          parentUser.role === 'super_admin' ||
          parentUser.role === 'superadmin' ||
          parentUser.role === 'transport_staff' ||
          parentUser.role === 'admin' ||
          parentUser.role === 'transport_admin' ||
          parentUser.role === 'faculty' ||
          parentUser.role === 'employee' ||
          parentUser.role === 'transport_manager' ||
          parentUser.is_staff ||
          parentUser.is_super_admin ||
          (parentUser.permissions && (
            parentUser.permissions.transport_access ||
            parentUser.permissions.admin_access ||
            parentUser.permissions.staff_access
          )) ||
          (typeof parentUser.role === 'string' && (
            parentUser.role.toLowerCase().includes('staff') ||
            parentUser.role.toLowerCase().includes('admin') ||
            parentUser.role.toLowerCase().includes('super') ||
            parentUser.role.toLowerCase().includes('faculty') ||
            parentUser.role.toLowerCase().includes('teacher') ||
            parentUser.role.toLowerCase().includes('manager')
          ))
        );

        if (hasStaffRole) {
          console.log('✅ Parent app authentication successful for staff - role validated:', parentUser.email);
          useParentAuth = true;
        } else {
          console.log('❌ Parent app user does not have staff role - detailed info:', {
            role: parentUser?.role,
            roleType: typeof parentUser?.role,
            checkedRoles: ['staff', 'transport_staff', 'admin', 'transport_admin', 'faculty', 'employee'],
            permissions: parentUser?.permissions,
            is_staff: parentUser?.is_staff,
            is_super_admin: parentUser?.is_super_admin,
            fullUserData: JSON.stringify(parentUser, null, 2)
          });
          parentUser = null;
        }
      } else {
        const errorText = await parentAuthResponse.text();
        console.log('❌ Parent app authentication failed:', {
          status: parentAuthResponse.status,
          error: errorText
        });
      }
    } catch (parentError) {
      console.warn('⚠️ Parent app authentication failed:', parentError);

      // Check if it's the specific confirmation_token error
      const errorMessage = parentError instanceof Error ? parentError.message : String(parentError);
      if (errorMessage.includes('confirmation_token') || errorMessage.includes('converting NULL to string')) {
        console.error('🔴 Parent app database error detected (confirmation_token NULL issue)');
        console.log('💡 This is a known issue with the parent app database schema');
        console.log('💡 The parent app needs to fix NULL values in the confirmation_token column');
        console.log('💡 Falling back to local staff authentication...');
      }

      // Continue with local authentication regardless of parent app issues
    }

    // If parent auth failed or user doesn't have staff role, try local database
    if (!useParentAuth) {
      console.log('🔄 Attempting local database staff authentication...');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          { error: 'Authentication service unavailable' },
          { status: 503 }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Find staff by email in local database (using admin_users table)
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (staffError || !staff) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please check your email and password.' },
          { status: 401 }
        );
      }

      // Check if staff account is active
      if (staff.is_active === false) {
        return NextResponse.json(
          { error: 'Staff account is not active. Contact administration.' },
          { status: 403 }
        );
      }

      // Verify password
      const passwordHash: string | null = staff.password_hash || null;
      if (!passwordHash) {
        return NextResponse.json(
          { error: 'Password not set for this staff account' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please check your email and password.' },
          { status: 401 }
        );
      }

      // Create staff session from local database
      console.log('✅ Local database staff authentication successful:', staff.email);

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      const session = {
        access_token: `staff-direct-${staff.id}-${Date.now()}`,
        refresh_token: `staff-refresh-${staff.id}-${Date.now()}`,
        expires_at: expiresAt
      };

      const user = {
        id: staff.id as string,
        email: staff.email as string,
        role: 'staff',
        user_metadata: {
          staff_id: staff.id as string,
          staff_name: (staff.name as string) || 'Staff Member',
          department: staff.department as string | undefined
        }
      };

      return NextResponse.json({
        success: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: 24 * 3600, // 24 hours in seconds
        token_type: 'Bearer',
        user,
        session,
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          role: staff.role
        },
        message: 'Staff authentication successful'
      });
    }

    // Handle parent app authentication success
    if (useParentAuth && parentUser) {
      console.log('✅ Using parent app authentication for staff');

      // Check if we have staff details in local database
      let localStaffData = null;
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const { data: staff } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

          if (staff) {
            localStaffData = {
              id: staff.id,
              name: staff.name,
              email: staff.email,
              department: staff.department,
              role: staff.role
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch local staff data:', error);
      }

      // Generate JWT-like token for consistency
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      const session = {
        access_token: `staff-parent-${parentUser.id}-${Date.now()}`,
        refresh_token: `staff-parent-refresh-${parentUser.id}-${Date.now()}`,
        expires_at: expiresAt
      };

      const user = {
        id: parentUser.id,
        email: parentUser.email,
        full_name: parentUser.full_name || parentUser.name,
        role: 'staff',
        user_metadata: {
          staff_id: localStaffData?.id || parentUser.id,
          staff_name: localStaffData?.name || parentUser.full_name || parentUser.name || 'Staff Member',
          department: localStaffData?.department || parentUser.department
        }
      };

      return NextResponse.json({
        success: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: 24 * 3600, // 24 hours in seconds
        token_type: 'Bearer',
        user,
        session,
        staff: localStaffData || {
          id: parentUser.id,
          name: parentUser.full_name || parentUser.name,
          email: parentUser.email,
          department: parentUser.department,
          role: parentUser.role
        },
        message: 'Staff authentication successful via parent app'
      });
    }

    // This should not happen, but fallback
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Staff direct login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { error: 'Authentication service error: ' + message },
      { status: 500 }
    );
  }
}
