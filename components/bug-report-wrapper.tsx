'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import FloatingBugReportButton from './floating-bug-report-button';

const BugReportWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Debug logging
    console.log('🐛 Bug Report Wrapper mounted:', {
      mounted: true,
      isAuthenticated,
      user: user,
      hasUser: !!user
    });
  }, [isAuthenticated, user]);

  // Don't render on server side
  if (!mounted) {
    return null;
  }

  // Show button even if not authenticated for testing (with fallback data)
  const fallbackUserId = user?.id || user?.sub || 'anonymous-user';
  const fallbackEmail = user?.email || 'test@example.com';
  const fallbackName = user?.student_name || user?.name || user?.full_name || 'Test User';

  console.log('🐛 Rendering FloatingBugReportButton with:', {
    userId: fallbackUserId,
    userEmail: fallbackEmail,
    userName: fallbackName,
    isAuthenticated
  });

  return (
    <FloatingBugReportButton
      userId={fallbackUserId}
      userEmail={fallbackEmail}
      userName={fallbackName}
    />
  );
};

export default BugReportWrapper;
