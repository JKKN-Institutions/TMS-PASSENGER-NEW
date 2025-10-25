'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Mail, Lock, AlertCircle, Eye, EyeOff, GraduationCap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import parentAuthService from '@/lib/auth/parent-auth-service';

export default function StaffLoginPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDirectLogin, setShowDirectLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OAuth Login Handler
  const handleOAuthLogin = () => {
    console.log('👔 [STAFF OAUTH] Step 1: Initiating staff OAuth login');

    // Store that this is a staff OAuth attempt for callback processing
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tms_oauth_role', 'staff');
      const verified = sessionStorage.getItem('tms_oauth_role');
      console.log('👔 [STAFF OAUTH] Step 2: Staff OAuth flag set in sessionStorage:', verified);
    }

    console.log('👔 [STAFF OAUTH] Step 3: Calling parent auth service login');
    parentAuthService.login('/staff'); // Redirect to staff dashboard after login
  };

  // Direct Login Handler
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('👔 Direct staff login attempt:', { email, hasPassword: !!password });

      // Try the staff direct login API
      const response = await fetch('/api/auth/staff-direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          app_id: 'transport_management_system_menrm674',
          api_key: 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Staff login successful:', data);

      // Store authentication data
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_staff_user', JSON.stringify(data.user));
        localStorage.setItem('tms_staff_token', data.access_token);
        localStorage.setItem('tms_staff_session', JSON.stringify(data.session));
        localStorage.setItem('tms_staff_data', JSON.stringify(data.staff));

        // Set cookies for session management
        document.cookie = `tms_staff_token=${data.access_token}; path=/; max-age=${24 * 60 * 60}`;
        if (data.refresh_token) {
          document.cookie = `tms_staff_refresh=${data.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}`;
        }
      }

      // Redirect to staff dashboard
      router.push('/staff');

    } catch (error) {
      console.error('❌ Staff login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Staff Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {showDirectLogin ? 'Direct authentication for staff members' : 'Sign in with your MYJKKN account'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-purple-100">
          {!showDirectLogin ? (
            /* OAuth Login - Default */
            <div className="space-y-6">
              <button
                onClick={handleOAuthLogin}
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-3 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
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

              {/* Alternative Login Option */}
              <div className="text-center border-t border-gray-100 pt-6">
                <button
                  onClick={() => setShowDirectLogin(true)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 underline transition-colors duration-200"
                >
                  Try direct login with email & password
                </button>
              </div>

              {/* Back Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-600 hover:text-purple-700 underline"
                >
                  ← Back to main login
                </button>
              </div>
            </div>
          ) : (
            /* Direct Login Form */
            <form className="space-y-6" onSubmit={handleDirectLogin}>
              <div className="flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => setShowDirectLogin(false)}
                  className="flex items-center text-gray-500 hover:text-purple-600 transition-colors duration-200 group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to OAuth Login
                </button>
              </div>

              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Staff'
                  )}
                </button>
              </div>

              {/* Back to main login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-sm text-purple-600 hover:text-purple-700 underline"
                >
                  ← Back to main login
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Box */}
        {!showDirectLogin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Staff Portal Access</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Access to grievances and management</li>
              <li>• Monitor transport operations</li>
              <li>• Manage student requests</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
