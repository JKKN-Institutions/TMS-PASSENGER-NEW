'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import FloatingBugReportButton from './floating-bug-report-button';

const BugReportWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server side or if not authenticated
  if (!mounted || !isAuthenticated || !user) {
    return null;
  }

  return (
    <FloatingBugReportButton
      userId={user.id}
      userEmail={user.email}
      userName={user.student_name || user.name || user.email}
    />
  );
};

export default BugReportWrapper;
