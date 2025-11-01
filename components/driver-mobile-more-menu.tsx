'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Home,
  Navigation,
  Route as RouteIcon,
  Users,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';

interface DriverMobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverMobileMoreMenu({ isOpen, onClose }: DriverMobileMoreMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const items = [
    { labelKey: 'more_menu.dashboard', href: '/driver', icon: Home },
    { labelKey: 'more_menu.live_tracking', href: '/driver/live-tracking', icon: Navigation },
    { labelKey: 'more_menu.routes', href: '/driver/routes', icon: RouteIcon },
    { labelKey: 'more_menu.bookings', href: '/driver/bookings', icon: Users },
    { labelKey: 'more_menu.passengers', href: '/driver/passengers', icon: Users },
    { labelKey: 'more_menu.profile', href: '/driver/profile', icon: User },
  ];

  const handleNav = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      onClose();
      router.push('/login');
    } catch (e) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-2xl border border-green-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('more_menu.driver_menu')}</h3>
              <button onClick={onClose} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-2">
              {items.map(({ labelKey, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <button
                    key={href}
                    onClick={() => handleNav(href)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 shadow-md'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-gray-100">
                        <Icon className={`h-5 w-5 ${active ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-sm font-medium ${active ? 'text-green-800' : 'text-gray-800'}`}>{t(labelKey)}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}

              <div className="h-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md"
              >
                <span className="text-sm font-semibold">{t('more_menu.logout')}</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


























