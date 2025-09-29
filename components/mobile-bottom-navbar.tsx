'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  Bell, 
  User, 
  Bus,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresEnrollment?: boolean;
  badge?: number;
}

export default function MobileBottomNavbar() {
  const pathname = usePathname();
  const enrollmentStatus = useEnrollmentStatus();
  const isEnrolled = enrollmentStatus?.isEnrolled || false;

  // Most essential navigation items for mobile
  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      requiresEnrollment: false
    },
    {
      name: 'Routes',
      href: '/dashboard/routes',
      icon: Bus,
      requiresEnrollment: true
    },
    {
      name: 'Schedule',
      href: '/dashboard/schedules',
      icon: Calendar,
      requiresEnrollment: true
    },
    {
      name: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard,
      requiresEnrollment: false
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      requiresEnrollment: false
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Background with blur effect */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-green-100 shadow-2xl">
        <div className="px-4 py-2">
          <nav className="flex items-center justify-around">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const disabled = item.requiresEnrollment && !isEnrolled;
              
              if (disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex flex-col items-center justify-center py-2 px-3 opacity-40 cursor-not-allowed"
                  >
                    <div className="relative p-2">
                      <item.icon className="h-5 w-5 text-gray-400" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">🔒</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium mt-1">
                      {item.name}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center py-2 px-3 relative group"
                >
                  <motion.div
                    className="relative"
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Active indicator background */}
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-green-100 to-yellow-100 rounded-xl -m-2"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                    
                    {/* Icon container */}
                    <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-gradient-to-r from-green-500 to-yellow-500 shadow-lg' 
                        : 'group-hover:bg-gray-100'
                    }`}>
                      <item.icon className={`h-5 w-5 transition-colors duration-200 ${
                        active 
                          ? 'text-white drop-shadow-sm' 
                          : 'text-gray-600 group-hover:text-green-600'
                      }`} />
                      
                      {/* Badge for notifications */}
                      {item.badge && item.badge > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Label */}
                  <span className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                    active 
                      ? 'text-green-700' 
                      : 'text-gray-600 group-hover:text-green-600'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-white/95" />
      </div>
    </div>
  );
}

