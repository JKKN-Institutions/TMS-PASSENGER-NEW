'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  XCircle,
  Phone,
  ChevronUp,
  ChevronDown,
  MapPinned,
  Timer,
  Zap,
  Route as RouteIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import dynamic from 'next/dynamic';
import PageWrapper from '@/components/page-wrapper';
import PassengerPageHeader from '@/components/passenger-page-header';

// Dynamically import the enhanced map component
const EnhancedLiveTrackingMap = dynamic(() => import('@/components/enhanced-live-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-t-green-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-700 font-medium text-lg">Loading map...</p>
        <p className="text-gray-500 text-sm mt-1">Preparing your bus tracking</p>
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
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    checkSessionAndLoadData();
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      if (studentId) {
        fetchLiveTrackingData(studentId, true);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [studentId]);

  const checkSessionAndLoadData = async () => {
    try {
      const session = sessionManager.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        router.push('/login');
        return;
      }

      setStudentId(currentStudent.student_id);
      await fetchLiveTrackingData(currentStudent.student_id);
    } catch (error) {
      console.error('Session check failed:', error);
      setError('Failed to load tracking data');
      setIsLoading(false);
    }
  };

  const fetchLiveTrackingData = async (studentId: string, silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/routes/live-tracking?student_id=${studentId}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
        calculateETA(result.data);
      } else {
        setError(result.message || 'Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      if (!silent) {
        setError('Failed to load tracking data');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const calculateETA = (data: TrackingData) => {
    if (!data.gps?.currentLocation || !data.route.stops || data.route.stops.length === 0) {
      setEta(null);
      return;
    }

    // Simple ETA calculation based on distance and average speed
    // In a real app, this would use proper routing and traffic data
    const avgSpeed = data.gps.currentLocation.speed || 30; // Default 30 km/h
    const distanceToNext = 5; // Mock distance in km
    const timeInMinutes = (distanceToNext / avgSpeed) * 60;
    
    setEta(`${Math.round(timeInMinutes)} min`);
  };

  const handleRefresh = async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    await fetchLiveTrackingData(studentId);
    setIsRefreshing(false);
    toast.success('Location updated', {
      icon: '📍',
      style: {
        borderRadius: '12px',
        background: '#10b981',
        color: '#fff',
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'recent': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-5 h-5" />;
      case 'recent': return <Clock className="w-5 h-5" />;
      case 'offline': return <WifiOff className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatTimeSince = (date: string | Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const updateTime = new Date(date);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes === 0) return 'Just now';
    if (diffMinutes === 1) return '1 min ago';
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return updateTime.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div 
              className="absolute inset-0 border-4 border-green-200 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute inset-0 border-4 border-t-green-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <Bus className="absolute inset-0 m-auto w-10 h-10 text-green-600" />
          </div>
          <p className="text-gray-700 font-semibold text-xl mb-2">Tracking your bus...</p>
          <p className="text-gray-500 text-sm">Getting real-time location</p>
        </motion.div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[80vh] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-red-100">
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Track Bus</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={checkSessionAndLoadData}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  if (!trackingData) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[80vh] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <Bus className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Route Assigned</h2>
            <p className="text-gray-600 mb-6">You don't have a route assigned yet. Please contact your administration.</p>
            <button
              onClick={() => router.push('/dashboard/routes')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View Available Routes
            </button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  const { route, gps, vehicle, driver } = trackingData;
  const isGPSEnabled = gps?.enabled;
  const gpsStatus = gps?.status || 'offline';
  const isOnline = gpsStatus === 'online';

  return (
    <PageWrapper className="bg-gray-50 pb-24 lg:pb-6">
      {/* Simple Header */}
      <PassengerPageHeader
        title="Live Track"
        icon={Navigation}
      />

      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                gpsStatus === 'online' ? 'bg-green-100 text-green-800' :
                gpsStatus === 'recent' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-600'
              }`}
              animate={{ scale: isOnline ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: isOnline ? Infinity : 0 }}
            >
              {getStatusIcon(gpsStatus)}
              <span className="ml-2 capitalize">
                {gpsStatus === 'online' ? 'Live Now' : gpsStatus === 'recent' ? 'Recently Active' : 'Offline'}
              </span>
            </motion.div>

            <span className="text-sm text-gray-600">Route {route.routeNumber}</span>

            {eta && isOnline && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-1 bg-[#0b6d41] text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <Timer className="w-4 h-4" />
                <span>{eta} ETA</span>
              </motion.div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-[#0b6d41] text-white px-3 py-2 rounded-lg hover:bg-[#085032] transition-all duration-200 disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
              style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}
            >
              {gps?.currentLocation ? (
                <EnhancedLiveTrackingMap
                  latitude={gps.currentLocation.latitude}
                  longitude={gps.currentLocation.longitude}
                  routeName={`Route ${route.routeNumber}`}
                  driverName={driver?.name || 'Unknown Driver'}
                  vehicleNumber={vehicle?.registrationNumber || 'Unknown Vehicle'}
                  heading={gps.currentLocation.heading}
                  speed={gps.currentLocation.speed}
                  stops={route.stops || []}
                  currentStopIndex={currentStopIndex}
                  isOnline={isOnline}
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center p-8">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold text-lg mb-2">Location Not Available</p>
                    {gps?.statusMessage && (
                      <p className="text-sm text-gray-500 max-w-md">{gps.statusMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Info Sidebar - Desktop */}
          <div className="hidden lg:block space-y-4">
            {/* Quick Stats */}
            {isOnline && gps?.currentLocation && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#0b6d41] rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8" />
                  <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-lg">Live</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Speed</span>
                    <span className="text-2xl font-bold">{gps.currentLocation.speed || 0} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Accuracy</span>
                    <span className="font-semibold">±{gps.currentLocation.accuracy}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/90">Updated</span>
                    <span className="font-semibold">{formatTimeSince(gps.currentLocation.lastUpdate)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Driver & Vehicle Card */}
            {(driver || vehicle) && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Bus className="w-5 h-5 mr-2 text-[#0b6d41]" />
                  Driver & Vehicle
                </h3>
                
                <div className="space-y-4">
                  {driver && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Driver</p>
                        <p className="font-semibold text-gray-900">{driver.name}</p>
                        <a href={`tel:${driver.phone}`} className="text-sm text-[#0b6d41] hover:text-[#085032] flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {driver.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {vehicle && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl">
                        🚌
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                        <p className="text-sm text-gray-600">{vehicle.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Route Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <RouteIcon className="w-5 h-5 mr-2 text-blue-600" />
                Route Details
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Route Number</p>
                  <p className="font-semibold text-gray-900 text-lg">{route.routeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Route Name</p>
                  <p className="font-semibold text-gray-900">{route.routeName}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">From</span>
                  </div>
                  <p className="font-semibold text-gray-900 ml-6">{route.startLocation}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">To</span>
                  </div>
                  <p className="font-semibold text-gray-900 ml-6">{route.endLocation}</p>
                </div>
                <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Departure</p>
                    <p className="font-semibold text-gray-900">{route.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arrival</p>
                    <p className="font-semibold text-gray-900">{route.arrivalTime}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <motion.div 
          initial={false}
          animate={{ y: isBottomSheetOpen ? 0 : '65%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white rounded-t-3xl shadow-2xl"
        >
          {/* Handle */}
          <button 
            onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
            className="w-full py-3 flex flex-col items-center"
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>
            {isBottomSheetOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Content */}
          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            {/* Quick Stats */}
            {isOnline && gps?.currentLocation && (
              <div className="bg-[#0b6d41] rounded-2xl p-4 sm:p-6 text-white mb-4">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-xs sm:text-sm font-semibold bg-white/20 px-2 sm:px-3 py-1 rounded-lg">Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-white/90 text-xs sm:text-sm">Speed</p>
                    <p className="text-xl sm:text-2xl font-bold">{gps.currentLocation.speed || 0}</p>
                    <p className="text-white/90 text-xs">km/h</p>
                  </div>
                  <div>
                    <p className="text-white/90 text-xs sm:text-sm">Accuracy</p>
                    <p className="text-lg sm:text-xl font-bold">±{gps.currentLocation.accuracy}</p>
                    <p className="text-white/90 text-xs">meters</p>
                  </div>
                  <div>
                    <p className="text-white/90 text-xs sm:text-sm">Updated</p>
                    <p className="text-xs sm:text-sm font-bold">{formatTimeSince(gps.currentLocation.lastUpdate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Driver & Vehicle */}
            {(driver || vehicle) && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <h3 className="font-bold text-gray-900 mb-3">Driver & Vehicle</h3>
                <div className="space-y-3">
                  {driver && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{driver.name}</p>
                        <a href={`tel:${driver.phone}`} className="text-sm text-[#0b6d41] flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {driver.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {vehicle && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl">
                        🚌
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{vehicle.registrationNumber}</p>
                        <p className="text-sm text-gray-600">{vehicle.model}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Route Info */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 mb-3">Route Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route</span>
                  <span className="font-semibold">{route.routeNumber} - {route.routeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-semibold">{route.startLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-semibold">{route.endLocation}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Departure</span>
                  <span className="font-semibold">{route.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Arrival</span>
                  <span className="font-semibold">{route.arrivalTime}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}