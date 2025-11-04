'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  User,
  MapPin,
  BadgeCheck,
  X,
  Route as RouteIcon,
  UserCheck,
  Users,
  TrendingUp,
  UserX,
  CheckSquare,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { staffHelpers } from '@/lib/staff-helpers';

interface Student {
  booking_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  boarding_stop: string;
  seat_number: string;
  booking_reference: string;
  attendance_status: 'present' | 'absent' | 'not_marked';
  scanned_at?: string;
  boarding_time?: string;
  attendance_method?: string;
}

export default function AttendanceManagePage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [staffRoutes, setStaffRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [stats, setStats] = useState<any>({});
  const [byStop, setByStop] = useState<any>({});
  const [selectedStop, setSelectedStop] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadData();
  }, [isAuthenticated, userType, isLoading, router]);

  useEffect(() => {
    if (selectedRouteId && selectedDate) {
      loadAttendance();
    }
  }, [selectedRouteId, selectedDate]);

  useEffect(() => {
    filterStudents();
  }, [students, selectedStop, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // Fetch staff routes
      if (staffRoutes.length === 0 && user?.id) {
        const routesData = await staffHelpers.getAssignedRoutes(user.id, user.email);
        setStaffRoutes(routesData);

        if (routesData.length > 0 && !selectedRouteId) {
          setSelectedRouteId(routesData[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await staffHelpers.getAttendanceOverview({
        routeId: selectedRouteId,
        date: selectedDate,
        staffEmail: user!.email
      });

      setStudents(data.students || []);
      setStats(data.stats || {});
      setByStop(data.byStop || {});
      setSelectedStudents(new Set());
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (selectedStop !== 'all') {
      filtered = filtered.filter(s => s.boarding_stop === selectedStop);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.attendance_status === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleMarkPresence = async (bookingId: string, status: 'present' | 'absent') => {
    try {
      setError(null);
      setSuccess(null);

      const result = await staffHelpers.markPresence(bookingId, status, user!.email);

      if (result.success) {
        setSuccess(`Marked ${status}: ${result.attendance.student_name}`);
        await loadAttendance();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Mark presence error:', err);
      setError(err.message || 'Failed to mark presence');
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      setBulkActionLoading(true);
      setError(null);
      setSuccess(null);

      let result;

      if (action === 'mark_all_absent') {
        result = await staffHelpers.bulkMarkAttendance({
          action: 'mark_all_absent',
          routeId: selectedRouteId,
          date: selectedDate,
          staffEmail: user!.email
        });
      } else {
        const bookingIds = Array.from(selectedStudents);
        if (bookingIds.length === 0) {
          setError('Please select at least one student');
          return;
        }

        result = await staffHelpers.bulkMarkAttendance({
          action: action as any,
          routeId: selectedRouteId,
          date: selectedDate,
          staffEmail: user!.email,
          bookingIds
        });
      }

      if (result.success) {
        setSuccess(result.message);
        await loadAttendance();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Bulk action error:', err);
      setError(err.message || 'Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleStudentSelection = (bookingId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedStudents(newSelection);
  };

  const selectAll = () => {
    const allIds = filteredStudents.map(s => s.booking_id);
    setSelectedStudents(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Manage</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm font-medium">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto">
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium uppercase">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total_bookings || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Students</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium uppercase">Present</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.present || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Marked</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-red-600 text-xs font-medium uppercase">Absent</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.absent || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Marked</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-600 text-xs font-medium uppercase">Pending</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.not_marked || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Not Marked</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium uppercase">Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.attendance_rate || 0}%</h3>
            <p className="text-gray-500 text-sm mt-1">Attendance</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Route Selector */}
            {staffRoutes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <RouteIcon className="w-4 h-4 inline mr-1" />
                  Route
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {staffRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.route_number} - {route.route_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Stop Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Boarding Stop
              </label>
              <select
                value={selectedStop}
                onChange={(e) => setSelectedStop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Stops</option>
                {Object.keys(byStop).map((stop) => (
                  <option key={stop} value={stop}>
                    {stop} ({byStop[stop].total})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="not_marked">Not Marked</option>
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <CheckSquare className="w-4 h-4 inline mr-1" />
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <XCircle className="w-4 h-4 inline mr-1" />
                Deselect All
              </button>
              <div className="flex-1"></div>
              <button
                onClick={() => handleBulkAction('mark_selected_present')}
                disabled={bulkActionLoading || selectedStudents.size === 0}
                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Mark Selected Present
              </button>
              <button
                onClick={() => handleBulkAction('mark_selected_absent')}
                disabled={bulkActionLoading || selectedStudents.size === 0}
                className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <UserX className="w-4 h-4 inline mr-1" />
                Mark Selected Absent
              </button>
              <button
                onClick={() => handleBulkAction('mark_all_absent')}
                disabled={bulkActionLoading}
                className="px-4 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                <UserX className="w-4 h-4 inline mr-1" />
                Mark All Unmarked Absent
              </button>
              <button
                onClick={loadAttendance}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Refresh
              </button>
            </div>
            {selectedStudents.size > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Students ({filteredStudents.length})</h2>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <div
                  key={student.booking_id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    selectedStudents.has(student.booking_id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.booking_id)}
                      onChange={() => toggleStudentSelection(student.booking_id)}
                      className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-900 text-lg">
                          {student.student_name}
                        </span>
                        <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                          {student.roll_number}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            student.attendance_status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : student.attendance_status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {student.attendance_status === 'not_marked' ? 'Not Marked' : student.attendance_status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{student.boarding_stop}</span>
                        </div>
                        {student.seat_number && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            Seat: {student.seat_number}
                          </span>
                        )}
                        {student.boarding_time && (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              Boarded at {new Date(student.boarding_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkPresence(student.booking_id, 'present')}
                          disabled={student.attendance_status === 'present'}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Present
                        </button>
                        <button
                          onClick={() => handleMarkPresence(student.booking_id, 'absent')}
                          disabled={student.attendance_status === 'absent'}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Mark Absent
                        </button>
                      </div>
                    </div>
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
