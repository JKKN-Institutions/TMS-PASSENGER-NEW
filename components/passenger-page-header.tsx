'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PassengerPageHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export default function PassengerPageHeader({
  title,
  icon: Icon,
  iconColor = 'text-green-600',
  iconBgColor = 'bg-green-50'
}: PassengerPageHeaderProps) {
  return (
    <div className="w-full bg-white rounded-lg p-4 sm:p-5 md:p-6 border border-gray-200">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${iconColor}`} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
