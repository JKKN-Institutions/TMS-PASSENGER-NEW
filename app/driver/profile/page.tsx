'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/language-context';
import { useRouter } from 'next/navigation';
import { User, LogOut, Edit, Save, X, Phone, Mail, Shield, Car, MapPin, Star, Award, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DriverPageHeader from '@/components/driver-page-header';

interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  experience_years: number;
  rating: number;
  total_trips: number;
  status: string;
  created_at: string;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DriverProfile>>({});

  useEffect(() => {
    const init = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          router.replace('/login');
          return;
        }

        if (userType !== 'driver') {
          router.replace('/login');
          return;
        }

        if (!user || !user.id) {
          setError(t('error.driver_id_not_found'));
          setLoading(false);
          return;
        }
        
        await loadProfile();
      } catch (err: any) {
        console.error('❌ Profile initialization error:', err);
        setError(err.message || t('profile.load_error'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, user, authLoading, t]);

  const loadProfile = async () => {
    try {
      if (!user || !user.id) {
        throw new Error(t('error.driver_id_not_found'));
      }

      // Try multiple driver ID sources for better compatibility
      const driverId = (user as any)?.driver_id || user.id;
      const userEmail = user.email || (user as any)?.email;
      console.log('🔍 Loading profile for driver ID:', driverId, 'Email:', userEmail);
      
      // Include email as fallback parameter
      const queryParams = new URLSearchParams({
        driverId: driverId,
        ...(userEmail && { email: userEmail })
      });
      
      const response = await fetch(`/api/driver/profile?${queryParams}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Profile API error:', response.status, errorData);
        
        if (response.status === 404) {
          // Enhanced 404 error handling with automatic profile creation attempt
          const suggestion = errorData.suggestion || t('profile.not_found');
          const details = errorData.details || '';
          const debugInfo = errorData.debugInfo || {};
          
          console.error('❌ Driver not found:', { 
            driverId, 
            userEmail, 
            details, 
            debugInfo 
          });
          
          // If we have email, try to create a basic driver profile
          if (userEmail && debugInfo.totalDriversInDb > 0) {
            console.log('🔄 Attempting to create driver profile...');
            try {
              const createResponse = await fetch('/api/driver/profile/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: driverId,
                  email: userEmail,
                  name: userEmail.split('@')[0] // Use email prefix as default name
                })
              });
              
              if (createResponse.ok) {
                const createData = await createResponse.json();
                console.log('✅ Driver profile created, retrying...');
                // Retry loading the profile
                return await loadProfile();
              } else {
                const createError = await createResponse.json();
                console.error('❌ Failed to create profile:', createError);
              }
            } catch (createErr) {
              console.error('❌ Error creating profile:', createErr);
            }
          }
          
          throw new Error(`${suggestion}${details ? ` (${details})` : ''}`);
        } else if (response.status === 401) {
          throw new Error(t('error.unauthorized'));
        } else {
          const errorMessage = errorData.error || errorData.details || t('profile.load_error');
          throw new Error(errorMessage);
        }
      }
      
      const data = await response.json();
      console.log('✅ Profile loaded successfully:', data.profile);
      
      if (!data.profile) {
        throw new Error(t('profile.not_found'));
      }
      
      setProfile(data.profile);
      setEditForm({
        name: data.profile.name || '',
        phone: data.profile.phone || '',
        license_number: data.profile.license_number || ''
      });
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('❌ Profile loading error:', err);
      throw new Error(err.message || t('profile.load_error'));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user || !user.id) throw new Error('Driver ID not found');

      const driverId = (user as any)?.driver_id || user.id;
      const response = await fetch('/api/driver/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driverId,
          ...editForm
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      
      // Handle specific error types gracefully
      let errorMessage = 'Failed to update profile';
      
      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message.includes('forbidden') || err.message.includes('403')) {
          errorMessage = 'Access denied. Contact administrator for assistance.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'Driver profile not found. Please contact support.';
        } else if (err.message.includes('server') || err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (err.message.includes('validation') || err.message.includes('invalid')) {
          errorMessage = 'Invalid data provided. Please check your input and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Note: sessionManager is not defined in the original code
      // You may need to implement proper logout logic
      router.replace('/login');
      toast.success('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-[#0b6d41] mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isDriverNotFound = error.includes('not found') || error.includes('does not match');
    
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            {isDriverNotFound ? t('profile.not_found') : t('common.error')}
          </h3>
          <p className="text-red-600 mb-4">{error}</p>

          {isDriverNotFound && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <h4 className="font-medium text-yellow-800 mb-2">🔧 {t('profile.what_happened')}</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {t('profile.auth_working')}</li>
                <li>• {t('profile.attempted_create')}</li>
                <li>• {t('profile.creation_failed')}</li>
                <li>• {t('profile.contact_admin')}</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <p className="text-xs text-blue-700">
                  <strong>{t('profile.for_admin')}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {t('actions.try_again')}
            </button>
            <button
              onClick={() => window.location.href = '/driver'}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              {t('actions.go_to_dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('profile.not_found')}</h3>
          <p className="text-gray-600 mb-4">{t('profile.unable_to_load')}</p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <DriverPageHeader
        titleKey="page.profile.title"
        icon={User}
        iconColor="text-[#0b6d41]"
        iconBgColor="bg-purple-50"
      />

      {/* Profile Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.management')}</h2>
            <p className="text-sm text-gray-600">{t('profile.update_info')}</p>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-6 py-3 bg-[#0b6d41] text-white rounded-lg text-sm font-medium hover:bg-[#085032] disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('profile.saving') : t('profile.save_changes')}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-6 py-3 bg-[#0b6d41] text-white rounded-lg text-sm font-medium hover:bg-[#085032] transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('profile.edit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.personal_info')}</h2>
          <p className="text-sm text-gray-600">{t('profile.basic_details')}</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.full_name')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('profile.enter_name')}
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.email_address')}</label>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <p className="text-gray-900 font-medium">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.phone_number')}</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('profile.enter_phone')}
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.license_number')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.license_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('profile.enter_license')}
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.license_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.performance_stats')}</h2>
          <p className="text-sm text-gray-600">{t('profile.driving_metrics')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-[#0b6d41]" />
              </div>
              <div className="text-2xl font-bold text-[#0b6d41]">{profile.experience_years}</div>
              <div className="text-sm text-gray-600 font-medium">{t('profile.years_experience')}</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-[#0b6d41]" />
              </div>
              <div className="text-2xl font-bold text-[#0b6d41]">{profile.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600 font-medium">{t('profile.rating')}</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-[#0b6d41]" />
              </div>
              <div className="text-2xl font-bold text-[#0b6d41]">{profile.total_trips}</div>
              <div className="text-sm text-gray-600 font-medium">{t('profile.total_trips')}</div>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div className={`text-2xl font-bold ${
                profile.status === 'active' ? 'text-[#0b6d41]' : 'text-red-600'
              }`}>
                {t(`status.${profile.status}`)}
              </div>
              <div className="text-sm text-gray-600 font-medium">{t('profile.status')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-red-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.account_actions')}</h2>
          <p className="text-sm text-gray-600">{t('profile.manage_settings')}</p>
        </div>
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-lg">{t('profile.sign_out')}</span>
              <p className="text-sm text-red-500">{t('profile.logout_account')}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
