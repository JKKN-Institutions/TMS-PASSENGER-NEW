'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  GraduationCap,
  Building,
  AlertCircle,
  Loader2,
  User,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  BadgeCheck,
  Hash,
  Building2
} from 'lucide-react';
import { staffHelpers } from '@/lib/staff-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Student {
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

export default function StaffStudentsPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [staffRoutes, setStaffRoutes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadStudents();
    loadDepartments();
  }, [isAuthenticated, userType, isLoading, router, selectedRoute]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, selectedRoute, departmentFilter, yearFilter, students]);

  const loadDepartments = async () => {
    try {
      const { data } = await supabase
        .from('departments')
        .select('id, department_name')
        .order('department_name');

      setDepartments(data || []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // Fetch staff routes first
      const routesData = await staffHelpers.getAssignedRoutes(user.id || '', user.email);
      setStaffRoutes(routesData);

      // Fetch all students/passengers using the new helper method
      const data = await staffHelpers.getPassengers({
        staffId: user.id,
        email: user.email,
        routeId: selectedRoute !== 'all' ? selectedRoute : undefined
      });

      setStudents(data.passengers || []);
      setFilteredStudents(data.passengers || []);
      setStats(data.stats || {});
    } catch (err: any) {
      console.error('❌ Error loading students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.student_name?.toLowerCase().includes(query) ||
          s.roll_number?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.phone?.toLowerCase().includes(query) ||
          s.department?.toLowerCase().includes(query)
      );
    }

    // Route filter
    if (selectedRoute !== 'all') {
      filtered = filtered.filter(s =>
        s.routes?.some(r => r.route_id === selectedRoute)
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(s => s.department?.toLowerCase().includes(departmentFilter.toLowerCase()));
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(s => s.year === yearFilter);
    }

    setFilteredStudents(filtered);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading students...</p>
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
            onClick={loadStudents}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const uniqueYears = Array.from(new Set(students.map(s => s.year).filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-yellow-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Students Directory</h1>
              <p className="text-white opacity-95 text-lg">View and manage student records</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Students</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total || students.length}</h3>
            <p className="text-gray-500 text-sm mt-1">Total students</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-sm font-medium">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.active || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Active students</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">Routes</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.routes_count || staffRoutes.length}</h3>
            <p className="text-gray-500 text-sm mt-1">Assigned routes</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-600 text-sm font-medium">Bookings</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total_bookings || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Total bookings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, roll number, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Routes</option>
                {staffRoutes.map(route => (
                  <option key={route.id} value={route.id}>
                    Route {route.route_number} - {route.route_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-gray-100">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchQuery || departmentFilter !== 'all' || yearFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No students available at the moment'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const isExpanded = expandedStudent === student.student_id;
              return (
                <div key={student.student_id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedStudent(isExpanded ? null : student.student_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {student.profile_image ? (
                            <img src={student.profile_image} alt={student.student_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {student.student_name}
                          </h3>
                          <p className="text-sm text-gray-600 font-mono">{student.roll_number}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                            {student.department && (
                              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {student.department}
                              </span>
                            )}
                            {student.year && (
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                Year {student.year}
                              </span>
                            )}
                            {student.routes && student.routes.length > 0 && (
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {student.routes[0].route_number}
                                {student.routes.length > 1 && ` +${student.routes.length - 1}`}
                              </span>
                            )}
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              {student.total_bookings} bookings
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="text-sm font-medium text-gray-900">{student.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Mobile</p>
                              <p className="text-sm font-medium text-gray-900">{student.phone}</p>
                            </div>
                          </div>

                          {student.section && (
                            <div className="flex items-center gap-3">
                              <Hash className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Section</p>
                                <p className="text-sm font-medium text-gray-900">{student.section}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <BadgeCheck className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Total Bookings</p>
                              <p className="text-sm font-medium text-gray-900">{student.total_bookings} bookings</p>
                            </div>
                          </div>
                        </div>

                        {student.routes && student.routes.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              Transport Details
                            </h4>
                            <div className="space-y-3">
                              {student.routes.map((route, idx) => (
                                <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                  <div className="font-medium text-gray-900 mb-1">
                                    Route {route.route_number} - {route.route_name}
                                  </div>
                                  <div className="text-gray-600 text-xs">
                                    {route.start_location} → {route.end_location}
                                  </div>
                                </div>
                              ))}
                              {student.boarding_stops && student.boarding_stops.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-2">Boarding Stops:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {student.boarding_stops.map((stop, idx) => (
                                      <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                                        {stop}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
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
        )}
      </div>
    </div>
  );
}
