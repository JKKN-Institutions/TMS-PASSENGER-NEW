'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  Navigation,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  User,
  Calendar
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  departure_time: string;
  arrival_time: string;
  distance: number;
  total_capacity: number;
  current_passengers: number;
  status: string;
  fare: number;
  driver?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    registration_number: string;
    model: string;
  };
}

export default function StaffRoutesPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadRoutes();
  }, [isAuthenticated, userType, isLoading, router]);

  useEffect(() => {
    filterRoutes();
  }, [searchQuery, statusFilter, routes]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // First, get staff's assigned routes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('staff_route_assignments')
        .select('route_id')
        .eq('staff_email', user.email.toLowerCase().trim())
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        // No routes assigned, show empty state
        setRoutes([]);
        setFilteredRoutes([]);
        setLoading(false);
        return;
      }

      // Get route IDs
      const routeIds = assignments.map(a => a.route_id);

      // Fetch only assigned routes
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select(`
          id,
          route_number,
          route_name,
          start_location,
          end_location,
          departure_time,
          arrival_time,
          distance,
          total_capacity,
          current_passengers,
          status,
          fare,
          driver_id,
          vehicle_id
        `)
        .in('id', routeIds)
        .order('route_number', { ascending: true });

      if (routesError) throw routesError;

      // Fetch driver and vehicle info
      const driverIds = routesData?.map(r => r.driver_id).filter(Boolean) || [];
      const vehicleIds = routesData?.map(r => r.vehicle_id).filter(Boolean) || [];

      let driversMap: Record<string, any> = {};
      let vehiclesMap: Record<string, any> = {};

      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, name, phone')
          .in('id', driverIds);

        driversMap = (drivers || []).reduce((acc, d) => {
          acc[d.id] = d;
          return acc;
        }, {} as Record<string, any>);
      }

      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id, registration_number, model')
          .in('id', vehicleIds);

        vehiclesMap = (vehicles || []).reduce((acc, v) => {
          acc[v.id] = v;
          return acc;
        }, {} as Record<string, any>);
      }

      const routesWithDetails = (routesData || []).map(route => ({
        ...route,
        driver: route.driver_id ? driversMap[route.driver_id] : undefined,
        vehicle: route.vehicle_id ? vehiclesMap[route.vehicle_id] : undefined
      }));

      setRoutes(routesWithDetails);
      setFilteredRoutes(routesWithDetails);
    } catch (err: any) {
      console.error('Error loading routes:', err);
      setError(err.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const filterRoutes = () => {
    let filtered = [...routes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.route_number.toLowerCase().includes(query) ||
          r.route_name.toLowerCase().includes(query) ||
          r.start_location.toLowerCase().includes(query) ||
          r.end_location.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRoutes(filtered);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadRoutes}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeRoutes = routes.filter(r => r.status === 'active').length;
  const totalCapacity = routes.reduce((sum, r) => sum + r.total_capacity, 0);
  const totalPassengers = routes.reduce((sum, r) => sum + r.current_passengers, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Routes</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Routes</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{routes.length}</h3>
            <p className="text-gray-500 text-sm mt-1">Total routes</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{activeRoutes}</h3>
            <p className="text-gray-500 text-sm mt-1">Active routes</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-sm font-medium">Passengers</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{totalPassengers}</h3>
            <p className="text-gray-500 text-sm mt-1">Current passengers</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-orange-600 text-sm font-medium">Capacity</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{totalCapacity}</h3>
            <p className="text-gray-500 text-sm mt-1">Total seats</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search routes by number, name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredRoutes.length} of {routes.length} routes
          </div>
        </div>

        {/* Routes List */}
        {filteredRoutes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-gray-100">
            <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No routes available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {route.route_number}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{route.route_name}</h3>
                        <p className="text-sm text-gray-600">Route {route.route_number}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        route.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {route.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm">
                        {route.start_location} → {route.end_location}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {route.departure_time} - {route.arrival_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-gray-400" />
                        <span>{route.distance} km</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>
                          {route.current_passengers}/{route.total_capacity} passengers
                        </span>
                      </div>
                      <div className="text-green-600 font-semibold">₹{route.fare}</div>
                    </div>
                  </div>

                  {(route.driver || route.vehicle) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {route.driver && (
                        <div className="flex items-center gap-2 text-xs text-gray-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                          <User className="w-3 h-3" />
                          <span>{route.driver.name}</span>
                        </div>
                      )}
                      {route.vehicle && (
                        <div className="flex items-center gap-2 text-xs text-gray-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          <Bus className="w-3 h-3" />
                          <span>{route.vehicle.registration_number}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/staff/routes/${route.id}`}
                    className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
