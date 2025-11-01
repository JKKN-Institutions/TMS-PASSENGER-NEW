'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-context';
import { driverHelpers } from '@/lib/supabase';
import {
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Route as RouteIcon,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  BadgeCheck,
  Hash,
  Building2,
  GraduationCap
} from 'lucide-react';

interface Passenger {
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  section: string;
  profile_image: string;
  routes: Array<{
    route_id: string;
    route_number: string;
    route_name: string;
    start_location: string;
    end_location: string;
  }>;
  boarding_stops: string[];
  total_bookings: number;
  route_count: number;
  latest_booking_date: string;
}

export default function DriverPassengersPage() {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<Passenger[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [driverRoutes, setDriverRoutes] = useState<any[]>([]);
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || userType !== 'driver') {
      router.replace('/driver/login');
      return;
    }

    loadData();
  }, [isAuthenticated, userType, authLoading, router]);

  useEffect(() => {
    filterPassengers();
  }, [passengers, searchQuery, selectedRoute]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // Fetch driver routes first
      const routesData = await driverHelpers.getAssignedRoutes(user.id || '', user.email);
      setDriverRoutes(routesData);

      // Fetch all passengers
      const data = await driverHelpers.getPassengers({
        driverId: user.id,
        email: user.email,
        routeId: selectedRoute !== 'all' ? selectedRoute : undefined
      });

      setPassengers(data.passengers || []);
      setFilteredPassengers(data.passengers || []);
      setStats(data.stats || {});
    } catch (err: any) {
      console.error('❌ Error loading passengers:', err);
      setError(err.message || 'Failed to load passengers');
    } finally {
      setLoading(false);
    }
  };

  const filterPassengers = () => {
    let filtered = [...passengers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.student_name?.toLowerCase().includes(query) ||
          p.roll_number?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query)
      );
    }

    // Route filter
    if (selectedRoute !== 'all') {
      filtered = filtered.filter((p) =>
        p.routes.some((r) => r.route_id === selectedRoute)
      );
    }

    setFilteredPassengers(filtered);
  };

  const togglePassengerDetails = (passengerId: string) => {
    setExpandedPassenger(expandedPassenger === passengerId ? null : passengerId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 break-words">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <span className="truncate">{t('nav.passengers')}</span>
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('driver.passengers.total')}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 truncate">{stats.total || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('driver.passengers.active')}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 truncate">{stats.active || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 truncate">{t('driver.passengers.total_bookings')}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 truncate">{stats.total_bookings || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Route Filter */}
          <div className="sm:w-64">
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">{t('common.all_routes')}</option>
              {driverRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  Route {route.route_number} - {route.route_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {t('common.showing')} {filteredPassengers.length} of {passengers.length} {t('driver.passengers.passengers')}
        </div>
      </div>

      {/* Passengers List */}
      {filteredPassengers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedRoute !== 'all'
              ? t('driver.passengers.no_results')
              : t('driver.passengers.no_passengers')}
          </h3>
          <p className="text-gray-600">
            {searchQuery || selectedRoute !== 'all'
              ? t('driver.passengers.try_different_filter')
              : t('driver.passengers.no_passengers_message')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredPassengers.map((passenger) => (
              <div key={passenger.student_id} className="p-4 sm:p-5 md:p-6 hover:bg-gray-50 transition-colors">
                <div
                  className="flex items-start justify-between cursor-pointer gap-3"
                  onClick={() => togglePassengerDetails(passenger.student_id)}
                >
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Profile Image */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {passenger.profile_image ? (
                        <img
                          src={passenger.profile_image}
                          alt={passenger.student_name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      )}
                    </div>

                    {/* Passenger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {passenger.student_name}
                        </h3>
                        <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{passenger.roll_number}</span>
                        </div>
                        {passenger.department && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{passenger.department}</span>
                          </div>
                        )}
                        {passenger.year && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Year {passenger.year}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                        <div className="flex items-center gap-1 text-xs sm:text-sm bg-green-50 text-green-700 px-2 py-1 rounded">
                          <RouteIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{passenger.route_count} {t('driver.passengers.routes')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{passenger.total_bookings} {t('driver.passengers.bookings')}</span>
                        </div>
                        {passenger.boarding_stops.length > 0 && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{passenger.boarding_stops.length} {t('driver.passengers.stops')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedPassenger === passenger.student_id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPassenger === passenger.student_id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    {/* Contact Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t('driver.passengers.contact_info')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {passenger.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${passenger.email}`} className="hover:text-green-600 truncate">
                              {passenger.email}
                            </a>
                          </div>
                        )}
                        {passenger.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a href={`tel:${passenger.phone}`} className="hover:text-green-600">
                              {passenger.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Routes */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        {t('driver.passengers.assigned_routes')}
                      </h4>
                      <div className="space-y-2">
                        {passenger.routes.map((route) => (
                          <div
                            key={route.route_id}
                            className="bg-gray-50 rounded-lg p-3 flex items-start gap-3"
                          >
                            <RouteIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Route {route.route_number}: {route.route_name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {route.start_location} → {route.end_location}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Boarding Stops */}
                    {passenger.boarding_stops.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {t('driver.passengers.boarding_stops')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {passenger.boarding_stops.map((stop, index) => (
                            <div
                              key={index}
                              className="bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{stop}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
