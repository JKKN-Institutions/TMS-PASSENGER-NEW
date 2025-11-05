'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Route,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Navigation,
  Calendar,
  CreditCard,
  Users,
  Star
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { RouteAccessControl } from '@/components/account-access-control';
import { Card, Button, Badge, Spinner, Alert, Avatar } from '@/components/modern-ui-components';
import toast from 'react-hot-toast';
import { RouteLoading } from '@/components/loading-screen';
import PassengerPageHeader from '@/components/passenger-page-header';

interface RouteInfo {
  id: string;
  routeName: string;
  routeNumber: string;
  startLocation: string;
  endLocation: string;
  fare: number;
  departureTime: string;
  arrivalTime: string;
  driverId?: string;
  stops?: RouteStop[];
}

interface DriverInfo {
  id: string;
  name: string;
  experience: number;
  rating: number;
  totalTrips: number;
  phone: string;
}

interface RouteStop {
  id: string;
  stopName: string;
  stopTime: string;
  sequenceOrder: number;
  isMajorStop: boolean;
}

interface BoardingStop {
  id: string;
  stopName: string;
  stopTime: string;
}

export default function RoutesPage() {
  const router = useRouter();
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [boardingStop, setBoardingStop] = useState<BoardingStop | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [nextDueAmount, setNextDueAmount] = useState<number | null>(null);

  const fetchRouteData = async () => {
    try {
      setError(null);
      const currentStudent = sessionManager.getCurrentStudent();
      
      if (!currentStudent?.student_id) {
        throw new Error('No student session found');
      }

      // Only fetch payment status if student has route allocation
      // Routes page means they already have allocation, so always check payment
      try {
        const paymentStatusData = await studentHelpers.getPaymentStatus(currentStudent.student_id);
        setPaymentStatus(paymentStatusData);
        
        // If account is inactive, fetch available fees for reactivation
        if (!paymentStatusData.isActive) {
          try {
            const feesData = await studentHelpers.getAvailableFees(currentStudent.student_id);
            const dueAmount = feesData?.available_options?.find((option: any) => 
              option.is_available && option.is_recommended
            )?.amount;
            setNextDueAmount(dueAmount);
          } catch (error) {
            console.error('Error fetching available fees:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
      }

      const routeData = await studentHelpers.getStudentRouteAllocationFormatted(currentStudent.student_id);
      
      // Log route data for debugging
      console.log('Route data received:', {
        hasRoute: !!routeData.route,
        routeId: routeData.route?.id,
        routeNumber: routeData.route?.routeNumber,
        hasDriver: !!routeData.driver,
        driverInfo: routeData.driver,
        studentId: currentStudent.student_id
      });
      
      if (routeData.route) {
        setRoute(routeData.route);
        setBoardingStop(routeData.boardingStop);
        setDriver(routeData.driver || null);
      } else {
        setError('No route allocation found');
      }
    } catch (error: any) {
      console.error('Route fetch error:', error);
      setError(error.message || 'Failed to load route information');
      toast.error('Failed to load route information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchRouteData();
    toast.success('Route information refreshed');
  };

  useEffect(() => {
    fetchRouteData();
  }, []);

  if (isLoading) {
    return <RouteLoading />;
  }

  if (error || !route) {
    return (
      <>
        <div className="space-y-6 py-4 sm:py-6">
          <PassengerPageHeader
            title="My Transport Route"
            icon={Bus}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
          />

        <Alert variant="warning" title="No Route Allocation">
          {error || 'You have not been allocated a transport route yet. Please contact the administration to request route allocation.'}
        </Alert>
        </div>
      </>
    );
  }

  const routeStats = [
    {
      title: 'Route Number',
      value: route.routeNumber,
      icon: Route,
      color: 'green'
    },

    {
      title: 'Journey Time',
      value: '45 mins',
      icon: Clock,
      color: 'purple'
    },
    {
      title: 'Capacity',
      value: '50 seats',
      icon: Users,
      color: 'orange'
    }
  ];

  return (
    <>
      <div className="space-y-8 pb-24 lg:pb-6">
        <RouteAccessControl
        isActive={paymentStatus?.isActive ?? true}
        nextDueAmount={nextDueAmount ?? undefined}
      >
        {/* Header */}
        <PassengerPageHeader
          title="My Transport Route"
          icon={Bus}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />

      {/* Route Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {routeStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card padding="md" hover>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <stat.icon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Route Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Route Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="lg">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Route className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-heading-3 text-gray-900 font-bold">Route Information</h3>
                </div>
              </div>

              <div className="space-y-6">
                {/* Route Path with All Boarding Points - Aligned Layout */}
                <div className="space-y-4">
                  {(() => {
                    // Sort stops once for efficiency
                    const sortedStops = route.stops ? route.stops.sort((a, b) => a.sequenceOrder - b.sequenceOrder) : [];
                    const firstStop = sortedStops[0];
                    const lastStop = sortedStops[sortedStops.length - 1];
                    const intermediateStops = sortedStops.filter(stop => 
                      stop.stopName !== firstStop?.stopName && stop.stopName !== lastStop?.stopName
                    );

                    return (
                      <>
                        {/* Starting Point */}
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-4 h-4 bg-green-600 rounded-full shadow-sm"></div>
                            <div className="w-0.5 h-4 bg-gray-300"></div>
                          </div>
                          <div className="flex-1 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900">
                                  {firstStop ? firstStop.stopName : route.startLocation}
                                </p>
                                <p className="text-sm text-gray-600 font-medium">Starting Point</p>
                              </div>
                              <Badge variant="success" className="bg-green-100 text-green-700">
                                {firstStop ? firstStop.stopTime : route.departureTime}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* All Intermediate Boarding Points */}
                        {intermediateStops.map((stop, index) => (
                          <div key={stop.id} className="flex items-center space-x-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full shadow-sm border-2 border-white ${
                                stop.isMajorStop ? 'bg-blue-600' : 'bg-gray-400'
                              }`}></div>
                              {index < intermediateStops.length - 1 && (
                                <div className="w-0.5 h-4 bg-gray-300"></div>
                              )}
                            </div>
                            <div className={`flex-1 p-4 rounded-lg border ${
                              stop.isMajorStop
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-bold text-gray-900">
                                      {stop.stopName}
                                    </p>
                                    {stop.isMajorStop && (
                                      <Badge variant="info" size="sm" className="bg-blue-100 text-blue-700">Major Stop</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-gray-600">
                                    Boarding Point
                                  </p>
                                </div>
                                <Badge variant={stop.isMajorStop ? "info" : "default"}>
                                  {stop.stopTime}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Final connector line before destination */}
                        {intermediateStops.length > 0 && (
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-4 bg-gray-300"></div>
                            </div>
                            <div className="flex-1"></div>
                          </div>
                        )}

                        {/* Destination */}
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-4 h-4 bg-red-600 rounded-full shadow-sm"></div>
                          </div>
                          <div className="flex-1 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900">
                                  {lastStop ? lastStop.stopName : route.endLocation}
                                </p>
                                <p className="text-sm text-gray-600 font-medium">Destination</p>
                              </div>
                              <Badge variant="danger" className="bg-red-100 text-red-700">
                                {lastStop ? lastStop.stopTime : route.arrivalTime}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Bus className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-500">Route Name</p>
                        <p className="font-semibold text-gray-900">{route.routeName}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Boarding Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card padding="md">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 w-5 text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900">Boarding Stop</h3>
              </div>
              
              {boardingStop ? (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-900">{boardingStop.stopName}</p>
                    <p className="text-sm text-gray-600 font-medium">Pickup Time: {boardingStop.stopTime}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Be ready 5 minutes before pickup time</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Default pickup at {route.startLocation}</p>
                  <p className="text-sm text-gray-500">Time: {route.departureTime}</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Driver Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card padding="md">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Users className="w-5 w-5 text-gray-600" />
                </div>
                <h3 className="font-bold text-gray-900">Driver Information</h3>
              </div>
              
              {driver ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      name={driver.name}
                      size="md"
                      status="online"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{driver.name}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{driver.rating.toFixed(1)} rating</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">Experience:</span>
                      <span className="font-bold text-gray-900">{driver.experience} years</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600 font-medium">Total Trips:</span>
                      <span className="font-bold text-gray-900">{driver.totalTrips.toLocaleString()}+</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600 font-medium">Contact:</span>
                      <span className="font-bold text-gray-900">{driver.phone}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Driver information not available</p>
                  <p className="text-sm text-gray-500">Driver details will be updated once assigned to this route</p>
                </div>
              )}
            </Card>
          </motion.div>

        </div>
      </div>
      </RouteAccessControl>
      </div>
      </>
  );
} 