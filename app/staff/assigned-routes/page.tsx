'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Route as RouteIcon,
  Users,
  MapPin,
  Clock,
  Bus,
  User,
  Phone,
  Mail,
  GraduationCap,
  Navigation,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building
} from 'lucide-react';

interface Student {
  id: string;
  student_name: string;
  roll_number: string;
  email: string;
  mobile: string;
  academic_year: number;
  semester: number;
  departments?: {
    id: string;
    department_name: string;
  };
  programs?: {
    id: string;
    program_name: string;
    degree_name: string;
  };
}

interface BoardingStop {
  id: string;
  stop_name: string;
  stop_time: string;
  sequence_order: number;
  latitude: number;
  longitude: number;
  is_major_stop: boolean;
}

interface Passenger {
  allocationId: string;
  student: Student;
  boardingStop: BoardingStop;
  allocatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  license_number: string;
  status: string;
  rating: number;
}

interface Vehicle {
  id: string;
  registration_number: string;
  model: string;
  capacity: number;
  fuel_type: string;
  status: string;
}

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  departure_time: string;
  arrival_time: string;
  distance: number;
  duration: string;
  total_capacity: number;
  current_passengers: number;
  status: string;
  fare: number;
  driver_id: string;
  vehicle_id: string;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface RouteWithPassengers {
  assignmentId: string;
  assignedAt: string;
  notes?: string;
  route: Route;
  passengers: Passenger[];
  passengerCount: number;
}

export default function StaffAssignedRoutesPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routesWithPassengers, setRoutesWithPassengers] = useState<RouteWithPassengers[]>([]);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [totalPassengers, setTotalPassengers] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        if (isLoading) {
          return;
        }

        if (!isAuthenticated || userType !== 'staff') {
          console.log('❌ Staff page access denied:', { isAuthenticated, userType, user });
          router.replace('/staff-login');
          return;
        }

        console.log('✅ Staff authenticated:', { user, userType });
        await fetchAssignedRoutes();
      } catch (err) {
        console.error('Error during initialization:', err);
        setError('Failed to initialize page');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated, userType, isLoading, user, router]);

  const fetchAssignedRoutes = async () => {
    try {
      if (!user?.email) {
        setError('User email not found');
        return;
      }

      const response = await fetch(`/api/staff/assigned-routes?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        setRoutesWithPassengers(data.routesWithPassengers || []);
        setTotalPassengers(data.totalPassengers || 0);
      } else {
        setError(data.error || 'Failed to load assigned routes');
      }
    } catch (err) {
      console.error('Error fetching assigned routes:', err);
      setError('Failed to load assigned routes');
    }
  };

  const toggleRouteExpansion = (routeId: string) => {
    setExpandedRoutes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  };

  const groupPassengersByStop = (passengers: Passenger[]) => {
    const grouped: Record<string, Passenger[]> = {};

    passengers.forEach((passenger) => {
      const stopName = passenger.boardingStop?.stop_name || 'Unassigned Stop';
      if (!grouped[stopName]) {
        grouped[stopName] = [];
      }
      grouped[stopName].push(passenger);
    });

    return Object.entries(grouped).sort((a, b) => {
      const seqA = a[1][0]?.boardingStop?.sequence_order || 0;
      const seqB = b[1][0]?.boardingStop?.sequence_order || 0;
      return seqA - seqB;
    });
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-yellow-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading assigned routes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-yellow-100 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <RouteIcon className="w-8 h-8 text-green-600" />
            My Assigned Routes
          </h1>
          <p className="text-gray-600 mt-2">
            View routes assigned to you and the passengers on each route
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Assigned Routes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {routesWithPassengers.length}
                </p>
              </div>
              <RouteIcon className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Passengers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalPassengers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average per Route</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {routesWithPassengers.length > 0
                    ? Math.round(totalPassengers / routesWithPassengers.length)
                    : 0}
                </p>
              </div>
              <Bus className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Routes List */}
        {routesWithPassengers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No routes assigned</h3>
            <p className="text-gray-600">
              You don&apos;t have any routes assigned yet. Contact your administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {routesWithPassengers.map((routeData) => {
              const isExpanded = expandedRoutes.has(routeData.route.id);
              const groupedPassengers = groupPassengersByStop(routeData.passengers);

              return (
                <div key={routeData.assignmentId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Route Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleRouteExpansion(routeData.route.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <RouteIcon className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {routeData.route.route_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Route {routeData.route.route_number}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              routeData.route.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {routeData.route.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              {routeData.route.start_location} → {routeData.route.end_location}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {routeData.route.departure_time} - {routeData.route.arrival_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {routeData.passengerCount}/{routeData.route.total_capacity} passengers
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Navigation className="w-4 h-4 flex-shrink-0" />
                            <span>{routeData.route.distance} km</span>
                          </div>
                        </div>

                        {/* Driver and Vehicle Info */}
                        <div className="mt-4 flex flex-wrap gap-4">
                          {routeData.route.driver && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Driver:</span>
                              <span>{routeData.route.driver.name}</span>
                              <span className="text-gray-500">({routeData.route.driver.phone})</span>
                            </div>
                          )}
                          {routeData.route.vehicle && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 bg-green-50 px-3 py-1.5 rounded-lg">
                              <Bus className="w-4 h-4" />
                              <span className="font-medium">Vehicle:</span>
                              <span>{routeData.route.vehicle.registration_number}</span>
                              <span className="text-gray-500">({routeData.route.vehicle.model})</span>
                            </div>
                          )}
                        </div>

                        {routeData.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                            <strong>Assignment Notes:</strong> {routeData.notes}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        <Link
                          href={`/staff/routes/${routeData.route.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </Link>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Passengers List (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Passengers ({routeData.passengerCount})
                      </h4>

                      {routeData.passengers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No passengers assigned to this route yet
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupedPassengers.map(([stopName, passengers]) => (
                            <div key={stopName}>
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-5 h-5 text-green-600" />
                                <h5 className="font-semibold text-gray-900">
                                  {stopName}
                                  {passengers[0]?.boardingStop && (
                                    <span className="text-sm text-gray-600 ml-2">
                                      ({passengers[0].boardingStop.stop_time})
                                    </span>
                                  )}
                                </h5>
                                <span className="ml-auto text-sm text-gray-600">
                                  {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {passengers.map((passenger) => (
                                  <div
                                    key={passenger.allocationId}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h6 className="font-semibold text-gray-900 truncate">
                                          {passenger.student.student_name}
                                        </h6>
                                        <p className="text-sm text-gray-600 font-mono">
                                          {passenger.student.roll_number}
                                        </p>

                                        <div className="mt-2 space-y-1">
                                          <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{passenger.student.email}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone className="w-3 h-3" />
                                            <span>{passenger.student.mobile}</span>
                                          </div>
                                          {passenger.student.departments && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <Building className="w-3 h-3" />
                                              <span className="truncate">
                                                {passenger.student.departments.department_name}
                                              </span>
                                            </div>
                                          )}
                                          {passenger.student.programs && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <GraduationCap className="w-3 h-3" />
                                              <span className="truncate">
                                                {passenger.student.programs.program_name}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                              Year {passenger.student.academic_year}, Sem {passenger.student.semester}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
