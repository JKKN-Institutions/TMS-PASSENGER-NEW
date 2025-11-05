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
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">{title}</h1>
    </div>
  );
}
