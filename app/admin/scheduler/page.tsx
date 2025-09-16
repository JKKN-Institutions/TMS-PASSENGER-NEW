'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface SchedulerStatus {
  timeSlot: string;
  status: string;
  lastRun?: string;
  startedAt?: string;
  notificationsSent: number;
  notificationsFailed: number;
  error?: string;
  dryRun: boolean;
}

interface SchedulerData {
  date: string;
  status: SchedulerStatus[];
  recommendations: {
    shouldRun5PM: boolean;
    shouldRun6PM: boolean;
    nextScheduledRun: string;
  };
  summary: {
    totalRuns: number;
    completedRuns: number;
    totalNotificationsSent: number;
  };
}

export default function SchedulerMonitoringPage() {
  const [schedulerData, setSchedulerData] = useState<SchedulerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSchedulerStatus();
  }, [selectedDate]);

  const fetchSchedulerStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/scheduler-status?date=${selectedDate}&detailed=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduler status');
      }

      const data = await response.json();
      setSchedulerData(data);
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      toast.error('Failed to load scheduler status');
    } finally {
      setLoading(false);
    }
  };

  const testScheduler = async (timeSlot: string) => {
    const schedulerKey = prompt('Enter scheduler key:');
    if (!schedulerKey) return;

    try {
      setTesting(timeSlot);
      const response = await fetch('/api/notifications/scheduler-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          timeSlot,
          schedulerKey,
          dryRun: true,
          force: true
        })
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const result = await response.json();
      toast.success(`Test completed for ${timeSlot}: ${result.result?.summary?.notificationsSent || 0} notifications would be sent`);
      
      // Refresh status after test
      await fetchSchedulerStatus();
    } catch (error) {
      console.error('Error testing scheduler:', error);
      toast.error('Test failed');
    } finally {
      setTesting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Notification Scheduler</h1>
            <p className="text-gray-600 mt-1">Monitor and manage automated booking reminders</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={fetchSchedulerStatus}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {schedulerData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Runs Today</p>
                  <p className="text-2xl font-bold text-gray-900">{schedulerData.summary.totalRuns}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Runs</p>
                  <p className="text-2xl font-bold text-green-600">{schedulerData.summary.completedRuns}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
                  <p className="text-2xl font-bold text-blue-600">{schedulerData.summary.totalNotificationsSent}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">📱</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scheduler Status */}
        {schedulerData && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Daily Schedule Status</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {schedulerData.status.map((timeSlot) => (
                <div key={timeSlot.timeSlot} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(timeSlot.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {timeSlot.timeSlot === '17:00' ? '5:00 PM' : '6:00 PM'} Reminder
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(timeSlot.status)}`}>
                          {timeSlot.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => testScheduler(timeSlot.timeSlot)}
                      disabled={testing === timeSlot.timeSlot}
                      className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {testing === timeSlot.timeSlot ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Test
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Notifications Sent:</span>
                      <span className="font-medium text-green-600">{timeSlot.notificationsSent}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">{timeSlot.notificationsFailed}</span>
                    </div>

                    {timeSlot.lastRun && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Run:</span>
                        <span className="font-medium">{new Date(timeSlot.lastRun).toLocaleTimeString()}</span>
                      </div>
                    )}

                    {timeSlot.dryRun && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">Last run was in test mode</span>
                        </div>
                      </div>
                    )}

                    {timeSlot.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{timeSlot.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Recommendations</h3>
              <div className="space-y-2 text-sm text-blue-800">
                {schedulerData.recommendations.shouldRun5PM && (
                  <p>• 5:00 PM scheduler should run now</p>
                )}
                {schedulerData.recommendations.shouldRun6PM && (
                  <p>• 6:00 PM scheduler should run now</p>
                )}
                <p>• Next scheduled run: {schedulerData.recommendations.nextScheduledRun}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
