'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface EnhancedLoadingProps {
  type?: 'auth' | 'page' | 'data' | 'action';
  message?: string;
  submessage?: string;
  progress?: number;
  error?: string | null;
  success?: boolean;
  showLogo?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  type = 'page',
  message,
  submessage,
  progress,
  error,
  success = false,
  showLogo = true,
  size = 'md',
  className = ''
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case 'auth':
        return 'Authenticating...';
      case 'data':
        return 'Loading data...';
      case 'action':
        return 'Processing...';
      default:
        return 'Loading...';
    }
  };

  const getDefaultSubmessage = () => {
    switch (type) {
      case 'auth':
        return 'Verifying your credentials';
      case 'data':
        return 'Please wait while we fetch your information';
      case 'action':
        return 'This may take a few moments';
      default:
        return 'Please wait';
    }
  };

  const sizes = {
    sm: {
      container: 'p-4',
      logo: 'w-8 h-8',
      spinner: 'w-5 h-5',
      title: 'text-base',
      subtitle: 'text-sm'
    },
    md: {
      container: 'p-6',
      logo: 'w-12 h-12',
      spinner: 'w-6 h-6',
      title: 'text-lg',
      subtitle: 'text-sm'
    },
    lg: {
      container: 'p-8',
      logo: 'w-16 h-16',
      spinner: 'w-8 h-8',
      title: 'text-xl',
      subtitle: 'text-base'
    },
    xl: {
      container: 'p-12',
      logo: 'w-20 h-20',
      spinner: 'w-10 h-10',
      title: 'text-2xl',
      subtitle: 'text-lg'
    }
  };

  const currentSize = sizes[size];

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`} style={{
        background: 'linear-gradient(135deg, #fefff8 0%, #f0fdf4 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center ${currentSize.container} max-w-md mx-auto`}
        >
          <div className="mb-6">
            <div className={`mx-auto ${currentSize.logo} rounded-full flex items-center justify-center bg-red-100`}>
              <AlertCircle className={`${currentSize.spinner} text-red-600`} />
            </div>
          </div>
          
          <h2 className={`font-bold text-gray-900 mb-2 ${currentSize.title}`}>
            Something went wrong
          </h2>
          <p className={`text-red-600 mb-4 ${currentSize.subtitle}`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white rounded-lg transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)'
            }}
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`} style={{
        background: 'linear-gradient(135deg, #fefff8 0%, #f0fdf4 100%)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center ${currentSize.container} max-w-md mx-auto`}
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`mx-auto ${currentSize.logo} rounded-full flex items-center justify-center`}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)'
              }}
            >
              <CheckCircle className={`${currentSize.spinner} text-white`} />
            </motion.div>
          </div>
          
          <h2 className={`font-bold text-gray-900 mb-2 ${currentSize.title}`}>
            Success!
          </h2>
          <p className={`text-gray-600 ${currentSize.subtitle}`}>
            {message || 'Operation completed successfully'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`} style={{
      background: 'linear-gradient(135deg, #fefff8 0%, #f0fdf4 100%)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center ${currentSize.container} max-w-md mx-auto`}
      >
        {/* Logo and Spinner */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {showLogo ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                <div className={`mx-auto ${currentSize.logo} rounded-full flex items-center justify-center mb-4`} style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.25)'
                }}>
                  {type === 'auth' ? (
                    <Shield className={`${currentSize.spinner} text-white`} />
                  ) : (
                    <Bus className={`${currentSize.spinner} text-white`} />
                  )}
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-transparent border-t-green-500 rounded-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className={`${currentSize.spinner} animate-spin mx-auto text-green-600`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`font-bold text-gray-900 ${currentSize.title}`}
          >
            {message || getDefaultMessage()}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-gray-600 ${currentSize.subtitle}`}
          >
            {submessage || getDefaultSubmessage()}
          </motion.p>

          {/* Progress Bar */}
          {progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4"
            >
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #eab308 100%)'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
            </motion.div>
          )}
        </div>

        {/* Floating Dots Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center space-x-1 mt-6"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full bg-green-400"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Skeleton Loading Components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`brand-card animate-pulse ${className}`}>
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="brand-card">
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default EnhancedLoading;
