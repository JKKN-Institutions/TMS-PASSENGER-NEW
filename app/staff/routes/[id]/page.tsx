'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Bus,
  User,
  Phone,
  Mail,
  Calendar,
  Download,
  Filter,
  Building,
  GraduationCap,
  Navigation,
  Star,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';

interface Passenger {
  allocationId: string;
  student: {
    id: string;
    student_name: string;
    roll_number: string;
    email: string;
    mobile: string;
    academic_year: number;
    semester: number;
    departments?: {
      department_name: string;
    };
    programs?: {
      program_name: string;
      degree_name: string;
    };
  };
  boardingStop: {
    stop_name: string;
    stop_time: string;
    sequence_order: number;
  };
  allocatedAt: string;
}

interface RouteData {
  route: {
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
      rating: number;
    };
    vehicle?: {
      registration_number: string;
      model: string;
      capacity: number;
    };
  };
  passengers: Passenger[];
  passengerCount: number;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterStop, setFilterStop] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadRouteData();
  }, [isAuthenticated, userType, isLoading, params.id]);

  const loadRouteData = async () => {
    try {
      if (!user?.email) {
        setError('User email not found');
        return;
      }

      const response = await fetch(`/api/staff/assigned-routes?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success && data.routesWithPassengers) {
        const route = data.routesWithPassengers.find((r: any) => r.route.id === params.id);

        if (route) {
          setRouteData(route);
        } else {
          setError('Route not found or not assigned to you');
        }
      } else {
        setError('Failed to load route data');
      }
    } catch (err) {
      console.error('Error loading route data:', err);
      setError('Failed to load route data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPassengers = () => {
    if (!routeData) return [];

    let filtered = routeData.passengers;

    if (filterStop !== 'all') {
      filtered = filtered.filter(p => p.boardingStop?.stop_name === filterStop);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(p => p.student.departments?.department_name === filterDepartment);
    }

    return filtered;
  };

  const getGroupedPassengers = () => {
    const filtered = getFilteredPassengers();
    const grouped: Record<string, Passenger[]> = {};

    filtered.forEach(passenger => {
      const stopName = passenger.boardingStop?.stop_name || 'Unassigned';
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

  const getUniqueStops = () => {
    if (!routeData) return [];
    const stops = new Set(routeData.passengers.map(p => p.boardingStop?.stop_name).filter(Boolean));
    return Array.from(stops);
  };

  const getUniqueDepartments = () => {
    if (!routeData) return [];
    const depts = new Set(routeData.passengers.map(p => p.student.departments?.department_name).filter(Boolean));
    return Array.from(depts);
  };

  const exportPassengerList = () => {
    if (!routeData) return;

    const filtered = getFilteredPassengers();
    const csvContent = [
      ['Name', 'Roll Number', 'Email', 'Mobile', 'Department', 'Program', 'Year', 'Semester', 'Boarding Stop', 'Stop Time'].join(','),
      ...filtered.map(p => [
        p.student.student_name,
        p.student.roll_number,
        p.student.email,
        p.student.mobile,
        p.student.departments?.department_name || 'N/A',
        p.student.programs?.program_name || 'N/A',
        p.student.academic_year,
        p.student.semester,
        p.boardingStop?.stop_name || 'N/A',
        p.boardingStop?.stop_time || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-${routeData.route.route_number}-passengers-${selectedDate}.csv`;
    a.click();
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading route details...</p>
        </div>
      </div>
    );
  }

  if (error || !routeData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/staff/assigned-routes"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-block"
          >
            Back to Routes
          </Link>
        </div>
      </div>
    );
  }

  const groupedPassengers = getGroupedPassengers();
  const filteredCount = getFilteredPassengers().length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/staff/assigned-routes"
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Route</h1>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">

        {/* Route Info Card */}
        <div className="bg-[#0b6d41] rounded-lg p-6 text-white border border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-2xl font-bold">
                {routeData.route.route_number}
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">{routeData.route.route_name}</h2>
                <div className="flex items-center gap-2 text-white opacity-95 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{routeData.route.start_location} → {routeData.route.end_location}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              routeData.route.status === 'active'
                ? 'bg-white text-[#0b6d41]'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {routeData.route.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white opacity-90 text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>Timing</span>
              </div>
              <p className="text-base font-semibold text-white">{routeData.route.departure_time} - {routeData.route.arrival_time}</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white opacity-90 text-xs mb-1">
                <Users className="w-4 h-4" />
                <span>Capacity</span>
              </div>
              <p className="text-base font-semibold text-white">{routeData.passengerCount}/{routeData.route.total_capacity}</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white opacity-90 text-sm mb-1">
                <Navigation className="w-4 h-4" />
                <span>Distance</span>
              </div>
              <p className="text-lg font-semibold text-white">{routeData.route.distance} km</p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white opacity-90 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>Fare</span>
              </div>
              <p className="text-lg font-semibold text-white">₹{routeData.route.fare}</p>
            </div>
          </div>
        </div>

        {/* Driver & Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routeData.route.driver && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Driver Information</h3>
                  <p className="text-sm text-gray-600">Assigned driver details</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{routeData.route.driver.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{routeData.route.driver.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-gray-900">{routeData.route.driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {routeData.route.vehicle && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vehicle Information</h3>
                  <p className="text-sm text-gray-600">Assigned vehicle details</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-semibold text-gray-900">{routeData.route.vehicle.registration_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-semibold text-gray-900">{routeData.route.vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="font-semibold text-gray-900">{routeData.route.vehicle.capacity} seats</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters & Export */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filter Passengers</h3>
            </div>

            <select
              value={filterStop}
              onChange={(e) => setFilterStop(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Stops</option>
              {getUniqueStops().map(stop => (
                <option key={stop} value={stop}>{stop}</option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <button
              onClick={exportPassengerList}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {filteredCount} of {routeData.passengerCount} passengers</span>
          </div>
        </div>

        {/* Passengers List */}
        <div className="space-y-6">
          {groupedPassengers.map(([stopName, passengers]) => (
            <div key={stopName} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#0b6d41]" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{stopName}</h3>
                      {passengers[0]?.boardingStop && (
                        <p className="text-sm text-gray-600">Time: {passengers[0].boardingStop.stop_time}</p>
                      )}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#0b6d41] text-white rounded-lg text-sm font-medium">
                    {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {passengers.map((passenger) => {
                  const isExpanded = expandedPassenger === passenger.allocationId;

                  return (
                    <div key={passenger.allocationId} className="hover:bg-gray-50 transition-colors">
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedPassenger(isExpanded ? null : passenger.allocationId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{passenger.student.student_name}</h4>
                              <p className="text-sm text-gray-600 font-mono">{passenger.student.roll_number}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                {passenger.student.departments && (
                                  <span>{passenger.student.departments.department_name}</span>
                                )}
                                {passenger.student.programs && (
                                  <span>• {passenger.student.programs.program_name}</span>
                                )}
                                <span>• Year {passenger.student.academic_year}, Sem {passenger.student.semester}</span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{passenger.student.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Mobile</p>
                                <p className="text-sm font-medium text-gray-900">{passenger.student.mobile}</p>
                              </div>
                            </div>
                            {passenger.student.departments && (
                              <div className="flex items-center gap-3">
                                <Building className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Department</p>
                                  <p className="text-sm font-medium text-gray-900">{passenger.student.departments.department_name}</p>
                                </div>
                              </div>
                            )}
                            {passenger.student.programs && (
                              <div className="flex items-center gap-3">
                                <GraduationCap className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Program</p>
                                  <p className="text-sm font-medium text-gray-900">{passenger.student.programs.program_name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {groupedPassengers.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-gray-100">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No passengers found</h3>
            <p className="text-gray-600">
              {filterStop !== 'all' || filterDepartment !== 'all'
                ? 'Try adjusting your filters'
                : 'No passengers assigned to this route yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
