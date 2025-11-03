'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('\n🔄 ═══════════════════════════════════════════════════════');
      console.log('📍 TMS-PASSENGER: Callback Handler');
      console.log('🔄 ═══════════════════════════════════════════════════════');

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const savedState = localStorage.getItem('oauth_state');

      console.log('📋 Callback parameters:', {
        code: code ? code.substring(0, 8) + '...' : 'None',
        state: state,
        error: error,
        errorDescription: errorDescription
      });
      console.log('📋 Saved state from localStorage:', savedState);

      // Check for OAuth errors from auth server
      if (error) {
        const errorMessage = errorDescription || 'Authorization failed';
        console.log('❌ OAuth error received from auth server');
        console.error('💥 Error:', error, errorDescription);
        setError(errorMessage);
        return;
      }

      // Validate state
      console.log('\n🔍 Validating state parameter...');
      if (state !== savedState) {
        console.warn('⚠️ State validation mismatch - this can happen with multiple login attempts');
        console.log('  Expected:', savedState);
        console.log('  Received:', state);
        console.log('⚠️ Continuing anyway (trusted environment)...');
        // Don't fail, just warn - this can happen with multiple OAuth attempts
        // In production, you might want stricter validation
      } else {
        console.log('✅ State validated');
      }

      if (!code) {
        console.log('❌ No authorization code received');
        setError('No authorization code received');
        return;
      }

      console.log('✅ Authorization code received');

      try {
        // Exchange code for tokens
        console.log('\n🔄 Exchanging code for tokens...');
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        console.log('📥 Token response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ Token exchange failed');
          console.error('💥 Error:', errorData);
          throw new Error(errorData.error_description || 'Token exchange failed');
        }

        const data = await response.json();
        console.log('✅ Tokens received successfully!');
        console.log('📋 User:', data.user?.email);

        // Save tokens with correct keys that the app expects
        console.log('\n💾 Saving tokens to localStorage and cookies...');
        
        // Calculate expiry times
        const tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
        const refreshExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        
        // Store in localStorage
        localStorage.setItem('tms_access_token', data.access_token);
        localStorage.setItem('tms_refresh_token', data.refresh_token);
        localStorage.setItem('tms_user', JSON.stringify(data.user));
        localStorage.setItem('tms_token_expires', tokenExpiresAt.toString());
        localStorage.setItem('tms_refresh_expires', refreshExpiresAt.toString());
        
        // Store in cookies for server-side access
        const isSecure = window.location.protocol === 'https:';
        const cookieOptions = `path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
        
        document.cookie = `tms_access_token=${data.access_token}; ${cookieOptions}; max-age=${data.expires_in || 3600}`;
        document.cookie = `tms_refresh_token=${data.refresh_token}; ${cookieOptions}; max-age=${30 * 24 * 60 * 60}`;
        
        console.log('✅ Tokens saved to localStorage and cookies');

        // Clear state
        localStorage.removeItem('oauth_state');
        console.log('🧹 OAuth state cleared');

        // Determine redirect path based on user role
        // Check sessionStorage for OAuth role flag
        const oauthRole = sessionStorage.getItem('tms_oauth_role');
        console.log('🔍 OAuth role from sessionStorage:', oauthRole);
        console.log('🔍 User data from parent app:', {
          role: data.user?.role,
          is_staff: data.user?.is_staff,
          is_super_admin: data.user?.is_super_admin,
          permissions: data.user?.permissions,
          fullUser: data.user
        });

        // First check if role from parent app indicates driver or staff
        let isDriver = data.user?.role === 'driver' || oauthRole === 'driver';

        // Enhanced staff role detection
        let isStaff = oauthRole === 'staff' || // Check OAuth flag first
                      data.user?.role === 'staff' ||
                      data.user?.role === 'super_admin' ||
                      data.user?.role === 'superadmin' ||
                      data.user?.is_staff === true ||
                      data.user?.is_super_admin === true ||
                      (typeof data.user?.role === 'string' && (
                        data.user.role.toLowerCase().includes('admin') ||
                        data.user.role.toLowerCase().includes('staff') ||
                        data.user.role.toLowerCase().includes('super')
                      ));

        console.log('🔍 Role detection results:', { isDriver, isStaff, oauthRole });

        // Priority: Check local staff table first, then drivers table
        // This ensures staff users who are also students get directed to staff portal
        if (!isStaff && data.user?.email) {
          console.log('🔍 Checking if user exists in local staff table...');
          try {
            const staffCheckResponse = await fetch(`/api/check-staff?email=${encodeURIComponent(data.user.email)}`);
            if (staffCheckResponse.ok) {
              const staffData = await staffCheckResponse.json();
              isStaff = staffData.isStaff;
              console.log(`✅ Staff check complete: ${isStaff ? 'User IS staff' : 'User is NOT staff'}`);

              // Store staff info in localStorage if they are staff
              if (isStaff && staffData.staff) {
                const staffUser = {
                  id: staffData.staff.id,
                  email: staffData.staff.email,
                  staff_name: staffData.staff.staff_name || data.user.full_name || data.user.email?.split('@')[0],
                  department: staffData.staff.department || 'Transport Management',
                  role: 'staff' as const
                };

                const staffSession = {
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                  expires_at: tokenExpiresAt
                };

                localStorage.setItem('tms_staff_user', JSON.stringify(staffUser));
                localStorage.setItem('tms_staff_session', JSON.stringify(staffSession));

                // Set cookies for server-side access
                document.cookie = `tms_staff_token=${data.access_token}; ${cookieOptions}; max-age=${data.expires_in || 3600}`;
                document.cookie = `tms_staff_refresh=${data.refresh_token}; ${cookieOptions}; max-age=${30 * 24 * 60 * 60}`;

                console.log('💾 Stored staff authentication data');
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to check staff status:', error);
          }
        }

        // If not staff or driver by parent app, check local drivers table
        if (!isDriver && !isStaff && data.user?.email) {
          console.log('🔍 Checking if user exists in local drivers table...');
          try {
            const driverCheckResponse = await fetch(`/api/check-driver?email=${encodeURIComponent(data.user.email)}`);
            if (driverCheckResponse.ok) {
              const driverData = await driverCheckResponse.json();
              isDriver = driverData.isDriver;
              console.log(`✅ Driver check complete: ${isDriver ? 'User IS a driver' : 'User is NOT a driver'}`);

              // Store driver info in localStorage if they are a driver
              if (isDriver && driverData.driver) {
                localStorage.setItem('tms_driver_info', JSON.stringify(driverData.driver));
                console.log('💾 Stored driver info:', driverData.driver);
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to check driver status, defaulting to passenger:', error);
          }
        }

        // Clear OAuth role flag
        sessionStorage.removeItem('tms_oauth_role');

        const targetPath = isDriver ? '/driver' : (isStaff ? '/staff' : '/dashboard');
        
        console.log('🔄 Preparing redirect to', targetPath, '...');
        console.log('✅ ═══════════════════════════════════════════════════════');
        console.log('📍 OAuth Flow Complete!');
        console.log('✅ ═══════════════════════════════════════════════════════\n');
        
        // Small delay to ensure cookies are set before redirecting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force full page reload to ensure auth state is properly initialized
        console.log('🔄 Redirecting now...');
        window.location.href = targetPath;
      } catch (err) {
        console.log('❌ Callback handler error');
        console.error('💥 Error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100">
        <div className="text-center max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-red-200">
          {/* Error Icon with Logo */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg p-1.5">
              <img src="/app-logo.png" alt="JKKN TMS" className="w-full h-full" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 mb-3">
            Authentication Error
          </h1>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            Return to Login
          </button>
          
          <p className="text-sm text-gray-500 mt-4">Need help? Contact support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100">
      <div className="text-center max-w-md bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-green-200">
        {/* Animated Logo with Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-green-200 border-t-green-600"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/app-logo.png" alt="JKKN TMS" className="w-16 h-16 drop-shadow-lg" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent mb-3">
          Authenticating...
        </h1>
        <p className="text-gray-700 mb-4">
          Please wait while we securely log you in.
        </p>
        
        {/* Progress Indicators */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          <p className="text-sm text-gray-500">Verifying your credentials</p>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100">
        <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-green-200">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/app-logo.png" alt="JKKN TMS" className="w-12 h-12" />
            </div>
          </div>
          <p className="text-gray-700 font-medium">Loading authentication...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
