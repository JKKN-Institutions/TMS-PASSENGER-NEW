import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';

type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'rejected' | string;

interface BugStatusBadgeProps {
  status: BugStatus;
  className?: string;
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  open: {
    label: 'Open',
    icon: AlertCircle,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: Loader2,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
};

const BugStatusBadge: React.FC<BugStatusBadgeProps> = ({ status, className = '' }) => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const config = statusConfig[normalizedStatus] || statusConfig.open;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${className}
      `}
    >
      <Icon className={`h-3.5 w-3.5 ${normalizedStatus === 'in_progress' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
};

export default BugStatusBadge;
