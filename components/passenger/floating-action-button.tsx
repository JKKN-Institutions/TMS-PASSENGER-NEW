'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  X,
  Calendar,
  Ticket,
  MessageCircle,
  HelpCircle,
  MapPin,
  History,
  Bell,
  CreditCard,
} from 'lucide-react';

interface FABOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: string;
  description: string;
}

export default function FloatingActionButton() {
  const router = useRouter();

  // Directly navigate to live track page when FAB is clicked
  const handleFABClick = () => {
    router.push('/dashboard/live-track');
  };

  return (
    <>
      {/* FAB Container - positioned higher to avoid bug report button */}
      <div className="fixed bottom-36 right-6 md:bottom-8 md:right-28 z-40 lg:hidden">
        {/* Main FAB Button - Redirects to Live Track */}
        <button
          onClick={handleFABClick}
          className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 bg-[#0b6d41] hover:bg-[#085032] hover:scale-110 active:scale-95"
          aria-label="Track your bus live"
          title="Live Track"
        >
          <Navigation className="w-6 h-6 text-white" />
        </button>

        {/* Pulse Animation Ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-[#0b6d41] animate-ping opacity-20" />
        </div>
      </div>
    </>
  );
}
