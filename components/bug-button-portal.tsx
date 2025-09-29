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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return null;
  }

  // Create a portal to render the button directly in the body
  // This ensures it's not affected by any layout constraints
  return createPortal(
    <div
      id="bug-report-portal"
      className="fixed right-6 z-[999999] pointer-events-auto"
      style={{
        bottom: isMobile ? '120px' : '24px'
      }}
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

