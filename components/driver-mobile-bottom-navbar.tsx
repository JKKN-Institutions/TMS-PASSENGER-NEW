'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Navigation,
  Route as RouteIcon,
  Users,
  MoreHorizontal,
  Plus,
  MapPin,
  Bug
} from 'lucide-react';
import DriverMobileMoreMenu from './driver-mobile-more-menu';
import { useLanguage } from '@/lib/i18n/language-context';

interface NavItem {
  nameKey: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  isMore?: boolean;
}

export default function DriverMobileBottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const navItems: NavItem[] = [
    { nameKey: 'mobile_nav.home', href: '/driver', icon: Home },
    { nameKey: 'mobile_nav.live', href: '/driver/live-tracking', icon: Navigation },
    { nameKey: 'mobile_nav.routes', href: '/driver/routes', icon: RouteIcon },
    { nameKey: 'mobile_nav.bookings', href: '/driver/bookings', icon: Users },
    { nameKey: 'mobile_nav.more', icon: MoreHorizontal, isMore: true },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/driver') return pathname === '/driver';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Speed-dial FAB for quick actions - Positioned above bug report button */}
      <div className="fixed bottom-[200px] lg:bottom-[104px] right-5 z-40">
        {/* Actions */}
        <div className="flex flex-col items-end space-y-3 mb-3">
          {fabOpen && (
            <>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={() => router.push('/driver/live-tracking')}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md border border-green-200 shadow-xl"
                aria-label={t('fab.start_tracking')}
              >
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow">
                  <Navigation className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800">{t('fab.start_tracking')}</span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onClick={() => router.push('/driver/location')}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md border border-green-200 shadow-xl"
                aria-label={t('fab.share_location')}
              >
                <div className="p-2 rounded-full bg-blue-500 text-white shadow">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800">{t('fab.share_location')}</span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => router.push('/dashboard/bug-reports')}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md border border-red-200 shadow-xl"
                aria-label={t('fab.report_issue')}
              >
                <div className="p-2 rounded-full bg-red-500 text-white shadow">
                  <Bug className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-gray-800">{t('fab.report_issue')}</span>
              </motion.button>
            </>
          )}
        </div>
        {/* Main FAB */}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className={`p-4 rounded-full shadow-2xl text-white active:scale-95 transition-transform ${
            fabOpen ? 'bg-gray-800' : 'bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600'
          }`}
          aria-label={fabOpen ? t('fab.close_actions') : t('fab.open_actions')}
        >
          <Plus className={`h-6 w-6 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-white/95 backdrop-blur-xl border-t border-green-100 shadow-2xl">
          <div className="px-2 py-2">
            <nav className="flex items-center justify-between">
              {navItems.map((item) => {
                if (item.isMore) {
                  return (
                    <button key={item.nameKey} onClick={() => setIsMoreOpen(true)} className="w-16 flex flex-col items-center justify-center py-1.5 px-1 group">
                      <div className="p-2 rounded-xl group-hover:bg-gray-100">
                        <item.icon className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                      </div>
                      <span className="text-[11px] font-medium mt-1 text-gray-600 group-hover:text-green-600">{t(item.nameKey)}</span>
                    </button>
                  );
                }
                const active = isActive(item.href);
                return (
                  <Link key={item.nameKey} href={item.href || '#'} className="w-16 flex flex-col items-center justify-center py-1.5 px-1 group">
                    <motion.div whileTap={{ scale: 0.95 }} className="relative">
                      {active && <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-green-500" />}
                      <div className={`p-2 rounded-xl ${active ? 'bg-gradient-to-r from-green-100 to-yellow-100' : 'group-hover:bg-gray-100'}`}>
                        <item.icon className={`h-5 w-5 ${active ? 'text-green-700' : 'text-gray-600 group-hover:text-green-600'}`} />
                      </div>
                    </motion.div>
                    <span className={`text-[11px] font-semibold mt-1 ${active ? 'text-green-800' : 'text-gray-600 group-hover:text-green-600'}`}>{t(item.nameKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <DriverMobileMoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
}


