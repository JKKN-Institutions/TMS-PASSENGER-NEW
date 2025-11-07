'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk';

const BugReportWrapper: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server side
  if (!mounted) {
    return children ? <>{children}</> : null;
  }

  // Get environment variables with fallbacks
  const apiKey = process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY || '';
  const apiUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL || '';

  // Only enable if both API key and URL are provided
  const isEnabled = Boolean(apiKey && apiUrl);

  // If not enabled, just render children without bug reporter
  if (!isEnabled) {
    console.warn('Bug Reporter SDK: Missing API key or URL. Bug reporting disabled.');
    return children ? <>{children}</> : null;
  }

  // Prepare user context
  const userContext = user ? {
    userId: user.id || user.sub || '',
    name: user.student_name || user.name || user.full_name || '',
    email: user.email || ''
  } : undefined;

  return (
    <BugReporterProvider
      apiKey={apiKey}
      apiUrl={apiUrl}
      enabled={true}
      debug={process.env.NODE_ENV === 'development'}
      userContext={userContext}
    >
      {children}
    </BugReporterProvider>
  );
};

export default BugReportWrapper;
