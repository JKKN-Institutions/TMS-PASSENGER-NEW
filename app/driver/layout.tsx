'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Navigation, 
  Users, 
  Car, 
  User, 
  Menu, 
  X, 
  Home,
  Route,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react';
import DriverRouteGuard from '@/components/driver-route-guard';
import { LanguageProvider, useLanguage } from '@/lib/i18n/language-context';
import LanguageSwitcher from '@/components/language-switcher';

// Inner layout component that uses language context
function DriverLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading, user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Skip auth check for driver login page
  if (typeof window !== 'undefined' && window.location.pathname === '/driver/login') {
    console.log('🔄 Driver layout: Skipping auth check for /driver/login');
    return <div className="min-h-screen">{children}</div>;
  }

  console.log('🔍 Driver layout auth state:', { isAuthenticated, userType, isLoading, user });

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading driver dashboard...</p>
      </div>
    );
  }

  const navigation = [
    { name: t('nav.dashboard'), href: '/driver', icon: Home, current: pathname === '/driver' },
    { name: t('nav.location'), href: '/driver/live-tracking', icon: Navigation, current: pathname === '/driver/live-tracking' },
    { name: t('nav.routes'), href: '/driver/routes', icon: Route, current: pathname === '/driver/routes' },
    { name: t('nav.schedules'), href: '/driver/bookings', icon: Users, current: pathname === '/driver/bookings' },
    { name: t('nav.profile'), href: '/driver/profile', icon: User, current: pathname === '/driver/profile' },
  ];

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <DriverRouteGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Driver App</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || 'Driver'}
                  </p>
                  <p className="text-xs text-gray-500">Professional Driver</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${
                      item.current ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <span>{t('dashboard.welcome', { name: user?.email || 'Driver' })}</span>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="min-h-[calc(100vh-4rem)] p-6">
            {children}
          </main>
        </div>
      </div>
    </DriverRouteGuard>
  );
}

// Main layout component with language provider
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider defaultLanguage="en">
      <DriverLayoutInner>
        {children}
      </DriverLayoutInner>
    </LanguageProvider>
  );
}