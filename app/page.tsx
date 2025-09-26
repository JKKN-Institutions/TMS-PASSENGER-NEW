'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, userType } = useAuth();

  useEffect(() => {
    console.log('🏠 Home page render:', {
      isAuthenticated,
      isLoading,
      userType,
      hasUser: !!user,
      userEmail: user?.email,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
    });

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Home page: Authentication check taking too long, forcing redirect to login');
        router.replace('/login');
      }
    }, 10000); // 10 second timeout

    if (!isLoading) {
      clearTimeout(timeout);
      
      if (isAuthenticated && user) {
        // Use the userType from AuthContext for accurate routing
        const redirectPath = userType === 'driver' ? '/driver' : '/dashboard';
        console.log('🔄 Home page: Redirecting authenticated user...', {
          userType,
          redirectPath,
          email: user.email
        });
        router.replace(redirectPath);
      } else {
        // Not authenticated, redirect to login
        // But check if we're already on a login page to avoid redirect loops
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!currentPath.includes('/login') && !currentPath.includes('/no-oauth')) {
          console.log('🔄 Home page: Not authenticated, redirecting to login');
          router.replace('/login');
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, user, userType, router]);

  // Loading state while authentication is being determined
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #fefff8 0%, #f0fdf4 100%)'
    }}>
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{color: '#22c55e'}} />
        <div>
          <p className="text-gray-600 text-lg font-semibold">MYJKKN TMS</p>
          <p className="text-gray-500 text-sm">
            {isLoading ? 'Checking authentication...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
}
