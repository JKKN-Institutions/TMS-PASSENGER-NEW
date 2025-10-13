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
  User,
  Plus
} from 'lucide-react';
import DriverMobileMoreMenu from './driver-mobile-more-menu';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  isMore?: boolean;
}

export default function DriverMobileBottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Home', href: '/driver', icon: Home },
    { name: 'Live', href: '/driver/live-tracking', icon: Navigation },
    { name: 'Routes', href: '/driver/routes', icon: RouteIcon },
    { name: 'Bookings', href: '/driver/bookings', icon: Users },
    { name: 'More', icon: User, isMore: true },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/driver') return pathname === '/driver';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* FAB for quick start live tracking */}
      <button
        onClick={() => router.push('/driver/live-tracking')}
        className="lg:hidden fixed bottom-20 right-5 z-40 p-4 rounded-full shadow-2xl bg-gradient-to-r from-green-500 to-yellow-500 text-white hover:from-green-600 hover:to-yellow-600 active:scale-95 transition-transform"
        aria-label="Start Live Tracking"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-white/95 backdrop-blur-xl border-t border-green-100 shadow-2xl">
          <div className="px-4 py-2">
            <nav className="flex items-center justify-around">
              {navItems.map((item) => {
                if (item.isMore) {
                  return (
                    <button key={item.name} onClick={() => setIsMoreOpen(true)} className="flex flex-col items-center justify-center py-2 px-3 group">
                      <div className="p-2 rounded-xl group-hover:bg-gray-100">
                        <item.icon className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                      </div>
                      <span className="text-xs font-medium mt-1 text-gray-600 group-hover:text-green-600">{item.name}</span>
                    </button>
                  );
                }
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href || '#'} className="flex flex-col items-center justify-center py-2 px-3 group">
                    <motion.div whileTap={{ scale: 0.95 }} className="relative">
                      <div className={`p-2 rounded-xl ${active ? 'bg-gradient-to-r from-green-100 to-yellow-100' : 'group-hover:bg-gray-100'}`}>
                        <item.icon className={`h-5 w-5 ${active ? 'text-green-700' : 'text-gray-600 group-hover:text-green-600'}`} />
                      </div>
                    </motion.div>
                    <span className={`text-xs font-medium mt-1 ${active ? 'text-green-800' : 'text-gray-600 group-hover:text-green-600'}`}>{item.name}</span>
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


