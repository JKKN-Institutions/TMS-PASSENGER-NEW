'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CreditCard, 
  Bus, 
  MapPin, 
  Calendar,
  Search,
  Wifi,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EmptyStateProps {
  type: 'notifications' | 'payments' | 'routes' | 'search' | 'offline' | 'error' | 'success';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  const getConfig = () => {
    switch (type) {
      case 'notifications':
        return {
          icon: Bell,
          defaultTitle: 'No notifications yet',
          defaultDescription: 'You\'ll see transport alerts and important updates here',
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)'
        };
      case 'payments':
        return {
          icon: CreditCard,
          defaultTitle: 'No payment history',
          defaultDescription: 'Your transport fee payments will appear here once completed',
          color: '#eab308',
          bgColor: 'rgba(234, 179, 8, 0.1)'
        };
      case 'routes':
        return {
          icon: Bus,
          defaultTitle: 'No route assigned',
          defaultDescription: 'Contact admin to get your transport route allocated',
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)'
        };
      case 'search':
        return {
          icon: Search,
          defaultTitle: 'No results found',
          defaultDescription: 'Try adjusting your search terms or filters',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
      case 'offline':
        return {
          icon: Wifi,
          defaultTitle: 'You\'re offline',
          defaultDescription: 'Check your internet connection and try again',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'error':
        return {
          icon: AlertCircle,
          defaultTitle: 'Something went wrong',
          defaultDescription: 'We encountered an error. Please try again later',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'success':
        return {
          icon: CheckCircle,
          defaultTitle: 'All done!',
          defaultDescription: 'Everything is up to date',
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)'
        };
      default:
        return {
          icon: AlertCircle,
          defaultTitle: 'Empty',
          defaultDescription: 'No data available',
          color: '#6b7280',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ 
          backgroundColor: config.bgColor,
          border: `2px solid ${config.color}20`
        }}
      >
        <Icon 
          className="w-8 h-8" 
          style={{ color: config.color }}
        />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-gray-900 mb-2"
      >
        {title || config.defaultTitle}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 mb-6 max-w-sm"
      >
        {description || config.defaultDescription}
      </motion.p>

      {actionText && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onAction}
          className="px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
          }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
};

// Specialized empty states for common scenarios
export const NotificationEmptyState: React.FC<{
  onRefresh?: () => void;
  className?: string;
}> = ({ onRefresh, className }) => (
  <EmptyState
    type="notifications"
    actionText={onRefresh ? "Refresh" : undefined}
    onAction={onRefresh}
    className={className}
  />
);

export const PaymentEmptyState: React.FC<{
  onPayNow?: () => void;
  className?: string;
}> = ({ onPayNow, className }) => (
  <EmptyState
    type="payments"
    actionText={onPayNow ? "Make Payment" : undefined}
    onAction={onPayNow}
    className={className}
  />
);

export const RouteEmptyState: React.FC<{
  onContactAdmin?: () => void;
  className?: string;
}> = ({ onContactAdmin, className }) => (
  <EmptyState
    type="routes"
    actionText={onContactAdmin ? "Contact Admin" : undefined}
    onAction={onContactAdmin}
    className={className}
  />
);

export const SearchEmptyState: React.FC<{
  searchTerm?: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({ searchTerm, onClearSearch, className }) => (
  <EmptyState
    type="search"
    title={searchTerm ? `No results for "${searchTerm}"` : "No results found"}
    actionText={onClearSearch ? "Clear Search" : undefined}
    onAction={onClearSearch}
    className={className}
  />
);

export const OfflineEmptyState: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <EmptyState
    type="offline"
    actionText={onRetry ? "Try Again" : undefined}
    onAction={onRetry}
    className={className}
  />
);

export const ErrorEmptyState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title, description, onRetry, className }) => (
  <EmptyState
    type="error"
    title={title}
    description={description}
    actionText={onRetry ? "Try Again" : undefined}
    onAction={onRetry}
    className={className}
  />
);

export const SuccessEmptyState: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({ title, description, className }) => (
  <EmptyState
    type="success"
    title={title}
    description={description}
    className={className}
  />
);

export default EmptyState;
