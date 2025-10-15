'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [DRIVER CALLBACK] Redirecting to unified callback URL for backward compatibility');
    
    // Preserve all URL parameters and redirect to unified callback
    const currentUrl = new URL(window.location.href);
    const unifiedCallbackUrl = new URL('/auth/callback', window.location.origin);
    
    // Copy all search parameters to the unified callback URL
    currentUrl.searchParams.forEach((value, key) => {
      unifiedCallbackUrl.searchParams.append(key, value);
    });
    
    // Ensure driver role is set in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tms_oauth_role', 'driver');
      console.log('🚗 [DRIVER CALLBACK] Driver OAuth role flag set for unified callback');
    }
    
    console.log('🔄 [DRIVER CALLBACK] Redirecting to:', unifiedCallbackUrl.toString());
    window.location.href = unifiedCallbackUrl.toString();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100">
      <div className="text-center bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-green-200 max-w-md">
        {/* Animated Logo */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/app-logo.png" alt="JKKN TMS" className="w-14 h-14 drop-shadow-lg" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent mb-3">
          Driver Authentication
        </h2>
        <p className="text-gray-700 mb-2">Redirecting to secure login...</p>
        <p className="text-sm text-gray-500">
          Please wait, you'll be redirected shortly.
        </p>
        
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
}
