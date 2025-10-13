import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-full relative ${className}`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right circle */}
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-green-200/20 to-yellow-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        {/* Bottom left circle */}
        <div className="absolute bottom-0 left-0 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tr from-blue-200/20 to-green-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        {/* Center accent */}
        <div className="absolute top-1/2 left-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-yellow-100/10 to-green-100/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;