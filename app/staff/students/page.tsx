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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Students</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Total</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.total || students.length}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter">Active</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.active || 0}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-[#0b6d41]" />
              <span className="text-xs text-gray-600 font-medium font-inter truncate">Routes</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">{stats.routes || 0}</h3>
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

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchQuery || departmentFilter !== 'all' || yearFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No students available at the moment'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Route</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 text-sm">{student.student_name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{student.roll_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{student.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{student.year ? `Year ${student.year}` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{student.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      {student.routes && student.routes.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-gray-900 text-xs font-medium">
                          <MapPin className="w-3 h-3 text-[#0b6d41]" />
                          <span className="font-semibold">{student.routes[0].route_number}</span>
                          {student.routes.length > 1 && <span className="text-gray-500"> +{student.routes.length - 1}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
