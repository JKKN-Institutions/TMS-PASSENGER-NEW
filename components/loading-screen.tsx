'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { THEME } from '@/lib/theme-constants';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
}

export default function LoadingScreen({ 
  message = "Loading...", 
  fullScreen = true,
  size = 'md',
  variant = 'default'
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'h-32',
    md: 'h-64', 
    lg: 'h-96'
  };

  const containerClasses = fullScreen 
    ? `fixed inset-0 ${THEME.gradients.background} flex items-center justify-center z-50`
    : `flex items-center justify-center ${sizeClasses[size]} ${THEME.gradients.background} rounded-2xl`;

  if (variant === 'minimal') {
    return (
      <div className={containerClasses}>
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-green-700 font-medium">{message}</span>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={containerClasses}>
        <div className="text-center max-w-md mx-auto p-8">
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative mx-auto w-20 h-20 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-600"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src="/app-logo.png" 
                  alt="Loading" 
                  className="w-16 h-16 drop-shadow-lg"
                />
              </div>
            </div>
            
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                Transport Management System
              </h2>
              <p className="text-green-700 font-medium mb-4">{message}</p>
            </motion.div>
          </motion.div>

          {/* Loading Progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full mb-4"
          />
          
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-sm text-green-600"
          >
            Please wait while we load your data...
          </motion.p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={containerClasses}>
      <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-200 max-w-sm mx-auto">
        {/* Animated Logo with Spinner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="relative mx-auto w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-600"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/app-logo.png" 
                alt="Loading" 
                className="w-12 h-12 drop-shadow-md"
              />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h3 className="text-xl font-bold text-green-900 mb-2">{message}</h3>
          <p className="text-green-700 text-sm">Fetching your transport data...</p>
        </motion.div>
      </div>
    </div>
  );
}

// Page-specific loading screens
export function DashboardLoading() {
  return (
    <LoadingScreen 
      message="Loading Dashboard" 
      variant="detailed"
    />
  );
}

export function ScheduleLoading() {
  return (
    <LoadingScreen 
      message="Loading Schedule" 
      variant="default"
    />
  );
}

export function PaymentLoading() {
  return (
    <LoadingScreen 
      message="Loading Payment Information" 
      variant="default"
    />
  );
}

export function ProfileLoading() {
  return (
    <LoadingScreen 
      message="Loading Profile" 
      variant="default"
    />
  );
}

export function RouteLoading() {
  return (
    <LoadingScreen 
      message="Loading Route Information" 
      variant="default"
    />
  );
}

export function LiveTrackLoading() {
  return (
    <LoadingScreen 
      message="Loading Live Tracking" 
      variant="detailed"
    />
  );
}

export function BugReportsLoading() {
  return (
    <LoadingScreen 
      message="Loading Bug Reports" 
      variant="default"
    />
  );
}

export function NotificationsLoading() {
  return (
    <LoadingScreen 
      message="Loading Notifications" 
      variant="default"
    />
  );
}

export function SettingsLoading() {
  return (
    <LoadingScreen 
      message="Loading Settings" 
      variant="default"
    />
  );
}

export function GrievancesLoading() {
  return (
    <LoadingScreen 
      message="Loading Grievances" 
      variant="default"
    />
  );
}

