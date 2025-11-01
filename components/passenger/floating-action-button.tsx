'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
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
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const options: FABOption[] = [
    {
      id: 'book',
      label: 'Book Schedule',
      icon: <Calendar className="w-5 h-5" />,
      href: '/passenger/schedules',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Book your next trip',
    },
    {
      id: 'tickets',
      label: 'My Tickets',
      icon: <Ticket className="w-5 h-5" />,
      href: '/passenger/bookings',
      color: 'bg-green-500 hover:bg-green-600',
      description: 'View active tickets',
    },
    {
      id: 'track',
      label: 'Track Bus',
      icon: <MapPin className="w-5 h-5" />,
      href: '/passenger/track',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Live bus tracking',
    },
    {
      id: 'history',
      label: 'Trip History',
      icon: <History className="w-5 h-5" />,
      href: '/passenger/history',
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Past bookings',
    },
    {
      id: 'support',
      label: 'Support',
      icon: <MessageCircle className="w-5 h-5" />,
      href: '/passenger/grievances',
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Get help',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/passenger/payments',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Payment history',
    },
  ];

  const handleOptionClick = (option: FABOption) => {
    setIsOpen(false);
    if (option.onClick) {
      option.onClick();
    } else if (option.href) {
      router.push(option.href);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container - positioned to avoid bug report button */}
      <div className="fixed bottom-24 right-6 md:bottom-6 md:right-24 z-50">
        {/* Menu Options */}
        <div
          className={`absolute bottom-20 right-0 flex flex-col-reverse gap-3 transition-all duration-300 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {options.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-3 group"
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              {/* Label */}
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>

              {/* Button */}
              <button
                onClick={() => handleOptionClick(option)}
                className={`${option.color} text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform transition-all duration-200 hover:scale-110 active:scale-95`}
                aria-label={option.label}
              >
                {option.icon}
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={toggleMenu}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 ${
            isOpen
              ? 'bg-red-500 hover:bg-red-600 rotate-45'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          } hover:scale-110 active:scale-95`}
          aria-label={isOpen ? 'Close menu' : 'Open quick actions menu'}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-white" />
          ) : (
            <Plus className="w-8 h-8 text-white" />
          )}
        </button>

        {/* Pulse Animation Ring (when closed) */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full">
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Alternative */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 p-6 md:hidden transform transition-transform duration-300">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={`${option.color} text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg transform transition-all active:scale-95`}
              >
                {option.icon}
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs opacity-90">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
