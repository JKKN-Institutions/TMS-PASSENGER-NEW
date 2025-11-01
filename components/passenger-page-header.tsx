'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface PassengerPageHeaderProps {
  titleKey: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export default function PassengerPageHeader({
  titleKey,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50'
}: PassengerPageHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${iconBgColor} rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${iconColor}`} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 break-words">
            {t(titleKey)}
          </h1>
        </div>
      </div>
    </div>
  );
}
