'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Car, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

type UserRole = 'passenger' | 'driver' | 'staff';

export default function LoginPage() {
  const { login, loginDriver, loginDriverDirect, loginDriverOAuth, isAuthenticated, isLoading, error, userType } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Combined useEffect for all initialization and redirect logic
  useEffect(() => {
    // Check for direct mode parameter
    const mode = searchParams?.get('mode');
    if (mode === 'direct') {
      setShowFallback(true);
      setSelectedRole('driver'); // Default to driver for direct mode
    }
    
    // Check if user is being redirected back from failed OAuth
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const hasOAuthState = !!sessionStorage.getItem('oauth_state');
    const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
    
    // If user is coming back from MYJKKN/Google without completing OAuth, auto-trigger workaround
    if (referrer.includes('jkkn.ac.in') && hasOAuthState && isDriverOAuth) {
      console.log('🔄 Detected user redirected back from MYJKKN without completing OAuth');
      console.log('🔄 Auto-triggering OAuth workaround for seamless authentication...');
      
      // Automatically redirect to unified callback with recovery flag
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.append('recovery', 'myjkkn_redirect');
      callbackUrl.searchParams.append('state', sessionStorage.getItem('oauth_state') || '');
      
      // Small delay to show user what's happening
      setTimeout(() => {
        console.log('🔄 Redirecting to OAuth recovery...');
        window.location.href = callbackUrl.toString();
      }, 1000);
      
      return; // Don't process other logic
    }
    
    // Auto-redirect authenticated users
    if (isAuthenticated && !isLoading) {
      const isDriver = userType === 'driver';
      const redirectPath = isDriver ? '/driver' : '/dashboard';
      
      console.log('✅ Login page: User authenticated, redirecting...', { userType, redirectPath });
      
      // If already on target path, do nothing
      if (typeof window !== 'undefined' && window.location.pathname.startsWith(redirectPath)) {
        return;
      }
      
      // Use hard navigation to avoid client router race conditions
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, isLoading, userType, router, searchParams]);

  const handleLogin = () => {
    if (selectedRole === 'passenger') {
      login(); // Passenger OAuth login
    } else {
      loginDriverOAuth(); // Driver OAuth login
    }
  };

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const success = await loginDriver(email, password);
      
      if (success) {
        console.log('✅ Driver login successful, redirecting to driver dashboard');
        router.push('/driver');
      } else {
        // Error will be set by AuthContext
        console.log('❌ Driver login failed');
      }
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setFallbackLoading(false);
    }
  };
//commit check
  const handleDriverDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const success = await loginDriverDirect(email, password);
      
      if (success) {
        console.log('✅ Driver direct login successful, redirecting to driver dashboard');
        router.push('/driver');
      } else {
        // Error will be set by AuthContext
        console.log('❌ Driver direct login failed');
      }
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Driver direct login failed');
    } finally {
      setFallbackLoading(false);
    }
  };

  const handleFallbackLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const response = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
          api_key: process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens and redirect
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_user', JSON.stringify(data.user));
        localStorage.setItem('tms_token_expires', data.session.expires_at);
        document.cookie = `tms_access_token=${data.access_token}; path=/; max-age=${data.expires_in}`;
        if (data.refresh_token) {
          document.cookie = `tms_refresh_token=${data.refresh_token}; path=/; max-age=${30 * 24 * 3600}`;
        }
      }

      router.push('/dashboard');
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setFallbackLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200 max-w-sm">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-[#0b6d41]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/app-logo.png" alt="Loading" className="w-12 h-12 drop-shadow-md" />
            </div>
          </div>
          <p className="text-gray-800 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200 max-w-sm">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-[#0b6d41]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/app-logo.png" alt="Loading" className="w-12 h-12 drop-shadow-md" />
            </div>
          </div>
          <p className="text-gray-800 text-lg font-semibold">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <img
              src="/app-logo.png"
              alt="JKKN TMS Logo"
              className="h-24 w-24 drop-shadow-lg"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Transport Management System
          </h2>
          <p className="mt-2 text-sm text-gray-700 font-medium">
            JKKN College Transport Portal
          </p>
        </div>

        {/* Error Display */}
        {(error || fallbackError) && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm">
            <div className="text-sm text-red-700 font-medium">{error || fallbackError}</div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-green-100 backdrop-blur-sm bg-white/95">
          <div className="space-y-6">
            {!selectedRole ? (
              /* Role Selection */
              <>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Choose Your Role
                  </h3>
                  <p className="text-sm text-gray-600 mb-8">
                    Select how you want to access the transport portal
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Passenger Option */}
                  <button
                    onClick={() => setSelectedRole('passenger')}
                    className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#0b6d41] focus:outline-none focus:ring-3 focus:ring-green-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-50 group-hover:bg-green-100 transition-all duration-300 shadow-md">
                      <Users className="h-7 w-7 text-[#0b6d41]" />
                    </div>
                    <div className="ml-4 text-left flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0b6d41] transition-colors">Passenger</h4>
                      <p className="text-sm text-gray-600">Students and staff members</p>
                    </div>
                    <div className="w-2 h-2 bg-[#0b6d41] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>

                  {/* Driver Option */}
                  <button
                    onClick={() => setSelectedRole('driver')}
                    className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#0b6d41] focus:outline-none focus:ring-3 focus:ring-green-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-50 group-hover:bg-green-100 transition-all duration-300 shadow-md">
                      <Car className="h-7 w-7 text-[#0b6d41]" />
                    </div>
                    <div className="ml-4 text-left flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#0b6d41] transition-colors">Driver</h4>
                      <p className="text-sm text-gray-600">Bus drivers</p>
                    </div>
                    <div className="w-2 h-2 bg-[#0b6d41] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>

                  {/* Staff Option */}
                  <button
                    onClick={() => router.push('/staff-login')}
                    className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-xl hover:border-purple-600 focus:outline-none focus:ring-3 focus:ring-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-all duration-300 shadow-md">
                      <GraduationCap className="h-7 w-7 text-purple-600" />
                    </div>
                    <div className="ml-4 text-left flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">Staff</h4>
                      <p className="text-sm text-gray-600">Administrative staff</p>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                </div>
              </>
            ) : !showFallback ? (
              /* Authentication Method Selection */
              <>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center text-gray-500 hover:text-green-600 transition-colors duration-200 group"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-lg bg-green-50">
                    {selectedRole === 'passenger' ? (
                      <Users className="h-8 w-8 text-[#0b6d41]" />
                    ) : (
                      <Car className="h-8 w-8 text-[#0b6d41]" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedRole === 'passenger' ? 'Passenger Login' : 'Driver Login'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Sign in with your MYJKKN account
                  </p>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-xl text-white focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl bg-[#0b6d41] hover:bg-[#085032] focus:ring-green-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Connecting to MYJKKN...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      <span>Sign in with MYJKKN</span>
                    </div>
                  )}
                </button>
                
                <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <p>🔒 Secure authentication via MYJKKN</p>
                </div>

                {/* Alternative login option for both roles */}
                <div className="text-center border-t border-gray-100 pt-6">
                  <button
                    onClick={() => setShowFallback(true)}
                    className="text-sm font-medium underline transition-colors duration-200 text-[#0b6d41] hover:text-[#085032]"
                  >
                    {selectedRole === 'passenger'
                      ? 'Having trouble? Try alternative login'
                      : 'Try direct login with enhanced authentication'
                    }
                  </button>
                </div>
              </>
            ) : (
              /* Login Form */
              <>
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setShowFallback(false)}
                    className="flex items-center text-gray-500 hover:text-green-600 transition-colors duration-200 group"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-lg bg-green-50">
                    {selectedRole === 'passenger' ? (
                      <Users className="h-8 w-8 text-[#0b6d41]" />
                    ) : (
                      <Car className="h-8 w-8 text-[#0b6d41]" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedRole === 'passenger' ? 'Alternative Login' : 'Direct Driver Login'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-8">
                    {selectedRole === 'passenger'
                      ? 'Sign in with your email and password'
                      : 'Enhanced authentication with parent app integration'
                    }
                  </p>
                </div>

                <form onSubmit={selectedRole === 'driver' ? handleDriverDirectLogin : handleFallbackLogin} className="space-y-6">
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={fallbackLoading}
                    className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-semibold rounded-xl text-white focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-[#0b6d41] hover:bg-[#085032] focus:ring-green-200"
                  >
                    {fallbackLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Signing in...
                      </div>
                    ) : (
                      selectedRole === 'passenger' ? 'Sign in as Passenger' : 'Sign in as Driver (Direct)'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <div className="mt-6 text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <p className="font-medium">Need help?</p>
            <p className="mt-1 text-xs">
              Contact your transport administrator or college administration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 