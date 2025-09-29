'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FloatingBugReportButton from './floating-bug-report-button';

interface BugButtonPortalProps {
  userId: string;
  userEmail: string;
  userName: string;
}

const BugButtonPortal: React.FC<BugButtonPortalProps> = ({ userId, userEmail, userName }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Create a portal to render the button directly in the body
  // This ensures it's not affected by any layout constraints
  return createPortal(
    <div
      id="bug-report-portal"
      className="fixed bottom-6 right-6 z-[999999] pointer-events-auto"
    >
      <FloatingBugReportButton
        userId={userId}
        userEmail={userEmail}
        userName={userName}
        className="bug-report-portal-button"
      />
    </div>,
    document.body
  );
};

export default BugButtonPortal;

