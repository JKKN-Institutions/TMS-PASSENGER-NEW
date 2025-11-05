'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  CreditCard,
  Calendar,
  Shield,
  ShieldAlert
} from 'lucide-react';

interface PaymentStatusBadgeProps {
  isActive: boolean;
  lastPaidTerm?: {
    termName: string;
    academicYear: string;
    semester: string;
    paidDate: string;
    validUntil: string;
    amount: number;
  };
  nextDueAmount?: number;
  nextDueDate?: string;
  className?: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  isActive,
  lastPaidTerm,
  nextDueAmount,
  nextDueDate,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const badgeVariants = {
    active: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    inactive: {
      scale: 0.98,
      rotate: 0,
      transition: { duration: 0.3 }
    }
  };

  if (isActive) {
    // Handle case with payment history
    if (lastPaidTerm) {
      const daysUntilExpiry = getDaysRemaining(lastPaidTerm.validUntil);
      const isNearExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      
      return (
        <motion.div
          variants={badgeVariants}
          animate="active"
          className={`relative overflow-hidden rounded-xl 
            bg-gradient-to-br from-green-50 to-yellow-50 
            dark:from-[var(--dark-bg-secondary)] dark:to-[var(--dark-bg-tertiary)]
            border-2 border-green-200 dark:border-[var(--neon-green)]
            p-4 sm:p-6 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_40px_rgba(0,255,136,0.15)]
            w-full ${className}`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-yellow-400/10
            dark:from-[rgba(0,255,136,0.1)] dark:to-[rgba(255,255,0,0.1)]"></div>
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 
            bg-yellow-200/20 dark:bg-[rgba(255,255,0,0.2)]
            rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 
            bg-green-200/20 dark:bg-[rgba(0,255,136,0.2)]
            rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-yellow-500 
                  dark:from-[var(--neon-green)] dark:to-[var(--neon-yellow)]
                  rounded-lg flex-shrink-0 shadow-md icon-glow">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-[var(--dark-bg-primary)] drop-shadow-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-green-800 dark:text-[var(--neon-green)] 
                    dark:drop-shadow-[0_0_10px_var(--neon-green-glow)] truncate">Account Active</h3>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-[var(--text-secondary)] truncate">Transport services enabled</p>
                </div>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 dark:text-[var(--neon-green)] 
                dark:drop-shadow-[0_0_15px_var(--neon-green-glow)] flex-shrink-0" />
            </div>

            {/* Payment Details */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-[var(--text-secondary)]">Last Paid Term:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-[var(--text-primary)] truncate">{lastPaidTerm.termName}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-[var(--text-secondary)]">Academic Year:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-[var(--text-primary)] truncate">{lastPaidTerm.academicYear}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-[var(--text-secondary)]">Amount Paid:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 dark:text-[var(--text-primary)] truncate">{formatCurrency(lastPaidTerm.amount)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-[var(--text-secondary)]">Valid Until:</span>
                <span className={`text-xs sm:text-sm font-bold ${isNearExpiry ? 'text-orange-600 dark:text-[var(--neon-orange)]' : 'text-green-800 dark:text-[var(--text-primary)]'} truncate`}>
                  {formatDate(lastPaidTerm.validUntil)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center justify-center">
              <div className="px-3 sm:px-4 py-2 
                bg-green-500 dark:bg-gradient-to-r dark:from-[var(--neon-green)] dark:to-[var(--neon-blue)]
                text-white dark:text-[var(--dark-bg-primary)]
                rounded-full text-xs sm:text-sm font-medium text-center
                dark:shadow-[0_4px_20px_var(--neon-green-glow)]">
                ✓ All Services Available
              </div>
            </div>

            {/* Expiry Warning */}
            {isNearExpiry && (
              <div className="mt-4 p-3 
                bg-orange-50 dark:bg-[rgba(255,102,0,0.1)]
                border border-orange-200 dark:border-[var(--neon-orange)]
                rounded-lg dark:shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-[var(--neon-orange)] 
                    flex-shrink-0 dark:drop-shadow-[0_0_10px_var(--neon-orange-glow)]" />
                  <span className="text-xs sm:text-sm text-orange-700 dark:text-[var(--neon-orange)]">
                    Expires in {daysUntilExpiry} days
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    // Handle case with no payment history but account is active
    // Don't show a card - term status is shown in header badge
    return null;
  }

  // Inactive account
  return (
    <motion.div
      variants={badgeVariants}
      animate="inactive"
      className={`relative overflow-hidden rounded-xl 
        bg-gradient-to-br from-red-50 to-orange-100 
        dark:from-[var(--dark-bg-secondary)] dark:to-[var(--dark-bg-tertiary)]
        border-2 border-red-200 dark:border-[var(--neon-orange)]
        p-4 sm:p-6 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_40px_rgba(255,102,0,0.15)]
        w-full ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-orange-600/10
        dark:from-[rgba(255,102,0,0.1)] dark:to-[rgba(255,102,0,0.2)]"></div>
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 
        bg-red-200/20 dark:bg-[rgba(255,102,0,0.2)]
        rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 
        bg-orange-200/20 dark:bg-[rgba(255,102,0,0.3)]
        rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 dark:bg-[var(--neon-orange)] rounded-lg flex-shrink-0 icon-glow">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-[var(--dark-bg-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-red-800 dark:text-[var(--neon-orange)] 
                dark:drop-shadow-[0_0_10px_var(--neon-orange-glow)] truncate">Account Inactive</h3>
              <p className="text-xs sm:text-sm text-red-600 dark:text-[var(--text-secondary)] truncate">Payment required for transport services</p>
            </div>
          </div>
          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 dark:text-[var(--neon-orange)] 
            flex-shrink-0 dark:drop-shadow-[0_0_15px_var(--neon-orange-glow)]" />
        </div>

        {/* Payment Required Info */}
        <div className="space-y-2 sm:space-y-3">
          {nextDueAmount && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-[var(--text-secondary)]">Next Due Amount:</span>
              <span className="text-xs sm:text-sm font-bold text-red-800 dark:text-[var(--text-primary)] truncate">{formatCurrency(nextDueAmount)}</span>
            </div>
          )}
          
          {nextDueDate && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-red-700 dark:text-[var(--text-secondary)]">Due Date:</span>
              <span className="text-xs sm:text-sm font-bold text-red-800 dark:text-[var(--text-primary)] truncate">{formatDate(nextDueDate)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-center">
          <div className="px-3 sm:px-4 py-2 
            bg-red-500 dark:bg-[var(--neon-orange)]
            text-white dark:text-[var(--dark-bg-primary)]
            rounded-full text-xs sm:text-sm font-medium text-center
            dark:shadow-[0_4px_20px_var(--neon-orange-glow)]">
            ⚠ Payment Required
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStatusBadge; 