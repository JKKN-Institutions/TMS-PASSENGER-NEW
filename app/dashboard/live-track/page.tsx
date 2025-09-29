'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import dynamic from 'next/dynamic';
import { LiveTrackLoading } from '@/components/loading-screen';

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMap = dynamic(() => import('@/components/live-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

interface TrackingData {
  route: {
    id: string;
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    departureTime: string;
    arrivalTime: string;
    distance: number;
    duration: string;
    status: string;
    stops: any[];
  };
  gps: {
    enabled: boolean;
    status: 'online' | 'recent' | 'offline';
    locationSource?: 'vehicle_gps' | 'driver_app' | 'route_gps' | 'none';
    locationStatus?: string;
    statusMessage?: string;
    currentLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      speed: number | null;
      heading: number | null;
      lastUpdate: string;
      source?: string;
    } | null;
    timeSinceUpdate?: number;
    device: {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    } | null;
    fallbackInfo?: {
      hasVehicle: boolean;
      hasDriver: boolean;
      driverSharingEnabled: boolean;
      vehicleTrackingEnabled: boolean;
      routeTrackingEnabled: boolean;
    };
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    model: string;
    capacity: number;
    status: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    status: string;
  };
}

export default function LiveTrackPage() {
  const router = useRouter();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      // Check if sessionManager is available
      if (typeof window === 'undefined' || !sessionManager) {
        setError('Session manager not available');
        setIsLoading(false);
        return;
      }

      const session = sessionManager.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent || !currentStudent.student_id) {
        setError('Student information not found');
        setIsLoading(false);
        return;
      }

      setStudentId(currentStudent.student_id);
      await fetchLiveTrackingData(currentStudent.student_id);
    } catch (error) {
      console.error('Session check failed:', error);
      setError('Failed to load session data');
      setIsLoading(false);
    }
  };

  const fetchLiveTrackingData = async (studentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/routes/live-tracking?student_id=${studentId}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
      } else {
        setError(result.message || 'Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setError('Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    await fetchLiveTrackingData(studentId);
    setIsRefreshing(false);
    toast.success('Tracking data refreshed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200';
      case 'recent': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTimeSince = (date: string | Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const updateTime = new Date(date);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes === 0) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return updateTime.toLocaleDateString();
  };

  if (isLoading) {
    return <LiveTrackLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Tracking</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={checkSessionAndLoadData}
            className="bg-gradient-to-r from-green-600 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-yellow-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bus className="h-12 w-12 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Route Assigned</h2>
          <p className="text-gray-600 mb-6">You don't have a route assigned yet. Please contact your administration.</p>
          <button
            onClick={() => router.push('/dashboard/routes')}
            className="bg-gradient-to-r from-green-600 to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-yellow-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            View My Routes
          </button>
        </div>
      </div>
    );
  }

  const { route, gps, vehicle, driver } = trackingData;
  const isGPSEnabled = gps?.enabled;
  const gpsStatus = gps?.status || 'offline';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 pb-24 lg:pb-0">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-yellow-500 shadow-2xl border-b border-green-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Navigation className="h-7 w-7 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow-sm">Live Bus Tracking</h1>
                  <div className="text-sm text-green-100 font-medium">
                    Route {route.routeNumber} - {route.routeName}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Main Content - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Live Location</h2>
                </div>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(gpsStatus)}`}>
                  {getStatusIcon(gpsStatus)}
                  <span className="ml-2 capitalize">{gpsStatus}</span>
                </div>
              </div>
              
              {gps?.currentLocation ? (
                <LiveTrackingMap
                  latitude={gps.currentLocation.latitude}
                  longitude={gps.currentLocation.longitude}
                  routeName={`Route ${route.routeNumber}`}
                  driverName={driver?.name || 'Unknown Driver'}
                  vehicleNumber={vehicle?.registrationNumber || 'Unknown Vehicle'}
                />
              ) : (
                <div className="h-96 bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-700 font-medium text-lg">Location not available</p>
                    {gps?.statusMessage && (
                      <p className="text-sm text-gray-600 mt-2 bg-white/50 rounded-lg px-3 py-1 inline-block">{gps.statusMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Sidebar - Status Information */}
          <div className="space-y-6">
            {/* Enhanced GPS Status Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Tracking Status</h3>
              </div>
              
              <div className="space-y-4">
                {/* GPS Status */}
                <div className={`border rounded-lg p-4 ${getStatusColor(gpsStatus)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(gpsStatus)}
                      <div>
                        <h4 className="font-semibold">
                          {gpsStatus === 'online' ? 'Bus is Live' : 
                           gpsStatus === 'recent' ? 'Recently Active' : 'Bus Offline'}
                        </h4>
                        <p className="text-sm opacity-75">
                          Last update: {formatTimeSince(gps?.currentLocation?.lastUpdate || '')}
                        </p>
                        {gps?.locationSource && (
                          <p className="text-xs opacity-75 mt-1">
                            Source: {gps.locationSource.replace('_', ' ').toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {gps?.statusMessage && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{gps.statusMessage}</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Location Information */}
                {gps?.currentLocation && (
                  <div className="border rounded-xl p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-green-300 shadow-sm">
                    <h4 className="font-bold text-green-900 mb-3">Current Location</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-mono">{gps.currentLocation.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-mono">{gps.currentLocation.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="text-green-600">±{gps.currentLocation.accuracy}m</span>
                      </div>
                      {gps.currentLocation.speed !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span>{gps.currentLocation.speed} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback Information */}
                {gps?.fallbackInfo && (
                  <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">System Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className={gps.fallbackInfo.hasVehicle ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.hasVehicle ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Driver:</span>
                        <span className={gps.fallbackInfo.hasDriver ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.hasDriver ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Location Sharing:</span>
                        <span className={gps.fallbackInfo.driverSharingEnabled ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.driverSharingEnabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Route Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Route Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Route Number</p>
                  <p className="font-semibold">{route.routeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Route Name</p>
                  <p className="font-semibold">{route.routeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-semibold">{route.startLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-semibold">{route.endLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departure Time</p>
                  <p className="font-semibold">{route.departureTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Arrival Time</p>
                  <p className="font-semibold">{route.arrivalTime}</p>
                </div>
              </div>
            </div>

            {/* Enhanced Driver & Vehicle Information */}
            {(driver || vehicle) && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Driver & Vehicle</h3>
                </div>
                
                <div className="space-y-4">
                  {driver && (
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-gray-500">{driver.phone}</p>
                    </div>
                  )}
                  
                  {vehicle && (
                    <div>
                      <p className="text-sm text-gray-600">Vehicle</p>
                      <p className="font-semibold">{vehicle.registrationNumber}</p>
                      <p className="text-sm text-gray-500">{vehicle.model}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
