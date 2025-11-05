'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Settings, 
  Bell, 
  MessageSquare, 
  Bug,
  LogOut,
  X,
  ChevronRight,
  MapPin,
  BarChart3,
  HelpCircle,
  Shield,
  Home,
  Bus,
  Calendar,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
import toast from 'react-hot-toast';

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  action?: () => void;
  requiresEnrollment?: boolean;
  description?: string;
  disabled?: boolean;
}

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const enrollmentStatus = useEnrollmentStatus();
  const isEnrolled = enrollmentStatus?.isEnrolled || false;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const mainMenuItems: MenuItem[] = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      description: 'Dashboard overview'
    },
    {
      name: 'My Routes',
      href: '/dashboard/routes',
      icon: Bus,
      description: 'View your assigned routes',
      requiresEnrollment: true
    },
    {
      name: 'Schedules',
      href: '/dashboard/schedules',
      icon: Calendar,
      description: 'View transport schedules',
      requiresEnrollment: true
    },
    {
      name: 'Live Track',
      href: '/dashboard/live-track',
      icon: MapPin,
      description: 'Track your bus in real-time',
      requiresEnrollment: true
    },
    {
      name: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard,
      description: 'Manage payments'
    },
    {
      name: 'Grievances',
      href: '/dashboard/grievances',
      icon: MessageSquare,
      description: 'Submit and track grievances'
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      description: 'View all notifications'
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'View and edit your profile'
    },
    {
      name: 'Bug Reports',
      href: '/dashboard/bug-reports',
      icon: Bug,
      description: 'Report issues and bugs'
    }
  ];

  const settingsItems: MenuItem[] = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'App preferences and settings'
    },
    {
      name: 'Help & Support',
      href: '/dashboard/help',
      icon: HelpCircle,
      description: 'Get help and support'
    }
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] lg:hidden"
            onClick={onClose}
          />

          {/* Bottom Menu */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[100] lg:hidden max-h-[85vh] flex flex-col"
          >
            {/* Handle Bar */}
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-[#0b6d41] flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold text-white">
                      {(user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User')?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {user && 'full_name' in user ? user.full_name : user && 'driver_name' in user ? user.driver_name : 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                    {user?.email || 'user@email.com'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Main Menu Items */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Menu
                </h3>
                <div className="space-y-1">
                  {mainMenuItems.map((item) => {
                    const isActive = item.href && pathname === item.href;
                    const isDisabled = item.disabled || (item.requiresEnrollment && !isEnrolled);

                    if (item.href) {
                      if (isDisabled) {
                        return (
                          <div
                            key={item.name}
                            className="flex items-center justify-between p-4 rounded-2xl opacity-50 cursor-not-allowed"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 rounded-xl bg-gray-100">
                                <item.icon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-400">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-400">🔒</span>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => handleItemClick(item)}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                            isActive
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl ${
                              isActive
                                ? 'bg-[#0b6d41]'
                                : 'bg-gray-100'
                            }`}>
                              <item.icon className={`h-5 w-5 ${
                                isActive ? 'text-white' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className={`font-medium ${
                                isActive ? 'text-[#0b6d41]' : 'text-gray-900'
                              }`}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 ${
                            isActive ? 'text-[#0b6d41]' : 'text-gray-400'
                          }`} />
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleItemClick(item)}
                        disabled={isDisabled}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:bg-gray-50 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 rounded-xl bg-gray-100">
                            <item.icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings Section */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Settings
                </h3>
                <div className="space-y-1">
                  {settingsItems.map((item) => {
                    const isActive = item.href && pathname === item.href;

                    if (item.href) {
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => handleItemClick(item)}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                            isActive
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl ${
                              isActive
                                ? 'bg-[#0b6d41]'
                                : 'bg-gray-100'
                            }`}>
                              <item.icon className={`h-5 w-5 ${
                                isActive ? 'text-white' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <p className={`font-medium ${
                                isActive ? 'text-[#0b6d41]' : 'text-gray-900'
                              }`}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 ${
                            isActive ? 'text-[#0b6d41]' : 'text-gray-400'
                          }`} />
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 rounded-xl bg-gray-100">
                            <item.icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-100 p-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Safe area for devices with home indicator */}
            <div className="h-safe-area-inset-bottom bg-white" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

