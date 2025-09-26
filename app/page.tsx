'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Loader2 } from 'lucide-react';
import { EnhancedLoading } from '@/components/enhanced-loading';

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

  // Enhanced loading state with better UX
  return (
    <EnhancedLoading
      type="auth"
      message={isLoading ? 'Checking authentication...' : 'Redirecting...'}
      submessage={isLoading ? 'Verifying your session and credentials' : 'Taking you to your dashboard'}
      size="xl"
      showLogo={true}
    />
  );
}
