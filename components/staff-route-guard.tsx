'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface StaffRouteGuardProps {
  children: React.ReactNode;
}

export default function StaffRouteGuard({ children }: StaffRouteGuardProps) {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 StaffRouteGuard: Auth check started:', { isLoading, isAuthenticated, userType, user });

    if (isLoading) {
      console.log('🔄 StaffRouteGuard: Still loading, waiting...');
      return;
    }

    // Check if user is authenticated and has staff role
    if (!isAuthenticated) {
      console.log('❌ StaffRouteGuard: Not authenticated, redirecting to staff login');
      setAuthError('You must be logged in to access staff features. Please log in with your staff account.');
      router.replace('/login');
      return;
    }

    if (userType !== 'staff') {
      console.log('❌ StaffRouteGuard: Wrong user type:', { userType, expectedType: 'staff' });
      setAuthError(`You are logged in as a ${userType}, but staff access requires a staff account. Please log in with a staff account or contact support if you believe this is an error.`);
      router.replace('/login');
      return;
    }

    // Additional check: ensure user has staff-specific data
    if (user) {
      const hasStaffRole = 'role' in user && (
        user.role === 'staff' ||
        user.role === 'super_admin' ||
        user.role === 'superadmin' ||
        (typeof user.role === 'string' && (
          user.role.toLowerCase().includes('admin') ||
          user.role.toLowerCase().includes('staff') ||
          user.role.toLowerCase().includes('super')
        ))
      );
      const hasStaffData = 'id' in user || 'staff_id' in user ||
                          ('user_metadata' in user && (user as any).user_metadata?.staff_id);

      console.log('🔍 Staff validation check:', {
        user,
        hasStaffRole,
        hasStaffData,
        userRole: (user as any).role,
        userId: (user as any).id
      });

      // Staff must have either the role OR the staff data
      if (!hasStaffRole) {
        console.log('❌ Staff access denied - missing staff role:', {
          hasRole: hasStaffRole,
          hasData: hasStaffData,
          userObject: user
        });
        setAuthError('Your account does not have staff role. Please log in with a staff account or contact support.');
        router.replace('/login');
        return;
      }
    }

    // All checks passed
    console.log('✅ StaffRouteGuard: All checks passed, authorizing access');
    setIsAuthorized(true);
    setAuthError(null);
  }, [isAuthenticated, userType, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Verifying staff access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">{authError}</p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/staff-login')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Go to Staff Login
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Main Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
