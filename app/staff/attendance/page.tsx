'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Camera,
  X,
  QrCode,
  Route as RouteIcon,
  UserCheck,
  Users,
  TrendingUp
} from 'lucide-react';
import { staffHelpers } from '@/lib/staff-helpers';
import { Html5Qrcode } from 'html5-qrcode';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  boarding_time: string | null;
  alighting_time: string | null;
  status: string;
  marked_by: string;
  created_at: string;
  students: {
    student_name: string;
    roll_number: string;
    email: string;
    mobile: string;
  };
  routes: {
    route_number: string;
    route_name: string;
    start_location: string;
    end_location: string;
  };
}

export default function StaffAttendancePage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [staffRoutes, setStaffRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [stats, setStats] = useState<any>({});

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || userType !== 'staff') {
      router.replace('/staff-login');
      return;
    }

    loadData();
  }, [isAuthenticated, userType, isLoading, router, selectedDate, selectedRouteId]);

  useEffect(() => {
    if (showScanner && scanning) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showScanner, scanning]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.email) {
        setError('User email not found');
        return;
      }

      // Fetch staff routes if not loaded
      if (staffRoutes.length === 0 && user?.id) {
        const routesData = await staffHelpers.getAssignedRoutes(user.id, user.email);
        setStaffRoutes(routesData);

        if (routesData.length > 0 && !selectedRouteId) {
          setSelectedRouteId(routesData[0].id);
        }
      }

      // Fetch attendance records
      const attendanceData = await staffHelpers.getAttendance({
        routeId: selectedRouteId || undefined,
        date: selectedDate,
        staffEmail: user.email
      });

      setAttendanceRecords(attendanceData.attendance || []);
      setStats(attendanceData.stats || {});
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setScannerError(null);

      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-attendance');
      }

      // Start scanning with continuous mode
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 30, // Higher FPS for faster detection
          qrbox: { width: 250, height: 250 }, // QR box size
          aspectRatio: 1.0, // Square aspect ratio
        },
        (decodedText) => {
          // Success callback when QR code is scanned
          console.log('✅ QR Code scanned:', decodedText);
          handleScanTicket(decodedText);
        },
        (errorMessage) => {
          // Error callback (fires frequently while searching, so we don't show it)
        }
      );

      console.log('✅ Camera started successfully');
    } catch (error: any) {
      console.error('❌ Error starting camera:', error);
      setScannerError('Unable to access camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        console.log('🛑 Camera stopped');
      }
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const handleScanTicket = async (ticketCode: string) => {
    if (!ticketCode || scanning) return;

    // Pause scanning during verification to prevent multiple scans
    const wasScanningBeforeVerify = showScanner;
    if (wasScanningBeforeVerify) {
      await stopCamera();
      setShowScanner(false);
    }

    try {
      setScanning(true);
      setError(null);
      setSuccess(null);

      const result = await staffHelpers.scanTicket(ticketCode, user!.email, user!.full_name);

      if (result.success) {
        setSuccess(
          result.alreadyScanned
            ? `Ticket already scanned: ${result.attendance.student_name}`
            : `Attendance recorded: ${result.attendance.student_name}`
        );

        // Reload attendance data
        await loadData();

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);

        // Clear manual input
        setManualCode('');
      } else {
        setError(result.error || 'Failed to scan ticket');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan ticket');
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanTicket(manualCode.trim());
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Simple Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">Attendance</h1>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Error/Success Messages */}
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
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm font-medium">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto">
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-600 text-xs font-medium uppercase">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Scanned</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-xs font-medium uppercase">Present</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.present || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Students</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-red-600 text-xs font-medium uppercase">Absent</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">{stats.absent || 0}</h3>
            <p className="text-gray-500 text-sm mt-1">Students</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-600 text-xs font-medium uppercase">Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800">
              {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
            </h3>
            <p className="text-gray-500 text-sm mt-1">Attendance</p>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Scan Ticket</h2>
            {!showScanner && (
              <button
                onClick={() => {
                  setShowScanner(true);
                  setScanning(true);
                }}
                disabled={scanning}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base flex-shrink-0"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Open Scanner</span>
              </button>
            )}
          </div>

          {showScanner && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                {/* QR Reader Container */}
                <div id="qr-reader-attendance" className="w-full"></div>
              </div>

              {scannerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{scannerError}</p>
                </div>
              )}

              {scanning && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Scanning QR codes...</span>
                </div>
              )}

              <button
                onClick={async () => {
                  await stopCamera();
                  setShowScanner(false);
                  setScanning(false);
                  setScannerError(null);
                }}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  <span>Stop Camera</span>
                </div>
              </button>
            </div>
          )}

          {/* Manual Entry */}
          <form onSubmit={handleManualSubmit} className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter ticket code manually:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter booking reference"
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                disabled={scanning}
              />
              <button
                type="submit"
                disabled={scanning || !manualCode.trim()}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 flex-shrink-0 text-sm sm:text-base"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="hidden sm:inline">Scanning...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Scan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Route Selector */}
        {staffRoutes.length > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <RouteIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Route</h3>
            </div>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Routes</option>
              {staffRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  Route {route.route_number} - {route.route_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Quick select:</span>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tomorrow
              </button>
            </div>

            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
            <p className="text-gray-600 text-sm mt-1">
              {attendanceRecords.length} record{attendanceRecords.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {attendanceRecords.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">Scan tickets to record attendance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Boarding Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">Marked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {record.students?.student_name || 'Unknown Student'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {record.students?.roll_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <RouteIcon className="w-3.5 h-3.5 text-[#0b6d41]" />
                          <span>{record.routes?.route_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {record.boarding_time ? (
                          new Date(record.boarding_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {new Date(record.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
