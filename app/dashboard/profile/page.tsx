'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  School, 
  CreditCard,
  Shield,
  Edit,
  Save,
  X,
  Heart,
  AlertTriangle,
  CheckCircle,
  Building,
  BookOpen,
  GraduationCap,
  Home,
  Users,
  Bus,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StudentProfile {
  id: string;
  student_name: string;
  roll_number: string;
  email: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  institution_name: string;
  department_name: string;
  program_name: string;
  degree_name: string;
  father_name: string;
  father_mobile: string;
  mother_name: string;
  mother_mobile: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address_street: string;
  address_district: string;
  address_state: string;
  address_pin_code: string;
  allocated_route_id: string;
  boarding_point: string;
  transport_status: string;
  transport_enrolled: boolean;
  payment_status: string;
  outstanding_amount: number;
  quota_type: any;
  transport_fee_amount: number;
  is_profile_complete: boolean;
  profile_completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get student ID from user context
      // For passenger users, studentId should be available, fallback to user.id if needed
      const studentId = (user as any)?.studentId || (user as any)?.student_id || user?.id;
      
      console.log('🔍 Profile fetch - studentId lookup:', {
        userStudentId: (user as any)?.studentId,
        userStudent_id: (user as any)?.student_id,
        userId: user?.id,
        finalStudentId: studentId,
        userEmail: user?.email
      });
      
      if (!studentId) {
        console.error('❌ No student ID found in user context:', user);
        toast.error('Student ID not found. Please login again.');
        return;
      }

      let response = await fetch(`/api/student/profile?studentId=${studentId}`);
      let data = await response.json();

      // If failed with student ID, try with email as fallback
      if (!response.ok && response.status === 404 && user?.email) {
        console.log('🔄 Profile fetch failed with studentId, trying with email:', user.email);
        response = await fetch(`/api/student/profile?email=${encodeURIComponent(user.email)}`);
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      if (data.success) {
        setProfile(data.data);
        setEditForm(data.data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const validateField = useCallback((field: keyof StudentProfile, value: string): string => {
    const trimmedValue = value?.trim();
    
    switch (field) {
      case 'mobile':
        if (!trimmedValue) return '';
        if (!/^[6-9]\d{9}$/.test(trimmedValue)) {
          return 'Enter a valid 10-digit mobile number starting with 6-9';
        }
        return '';
        
      case 'emergency_contact_phone':
        if (!trimmedValue) return '';
        if (!/^[6-9]\d{9}$/.test(trimmedValue)) {
          return 'Enter a valid 10-digit emergency contact number';
        }
        return '';
        
      case 'father_mobile':
        if (!trimmedValue) return '';
        if (!/^[6-9]\d{9}$/.test(trimmedValue)) {
          return 'Enter a valid 10-digit father\'s mobile number';
        }
        return '';
        
      case 'mother_mobile':
        if (!trimmedValue) return '';
        if (!/^[6-9]\d{9}$/.test(trimmedValue)) {
          return 'Enter a valid 10-digit mother\'s mobile number';
        }
        return '';
        
      case 'address_pin_code':
        if (!trimmedValue) return '';
        if (!/^\d{6}$/.test(trimmedValue)) {
          return 'Enter a valid 6-digit PIN code';
        }
        return '';
        
      case 'emergency_contact_name':
        if (trimmedValue && trimmedValue.length < 2) {
          return 'Emergency contact name should be at least 2 characters';
        }
        return '';
        
      case 'roll_number':
        if (trimmedValue && trimmedValue.length < 3) {
          return 'Roll number should be at least 3 characters';
        }
        return '';
        
      default:
        return '';
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all form fields
    Object.keys(editForm).forEach(key => {
      const field = key as keyof StudentProfile;
      const value = editForm[field] as string;
      const error = validateField(field, value || '');
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setIsSaving(true);
      
      const studentId = profile?.id;
      if (!studentId) {
        toast.error('Student ID not found');
        return;
      }

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          updates: editForm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.success) {
        // Update profile with the returned data from server
        setProfile(data.data || { ...profile!, ...editForm });
        setEditForm({});
        setErrors({});
        setTouched({});
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile || {});
    setErrors({});
    setTouched({});
    setIsEditing(false);
  };

  const startEditing = () => {
    // Initialize edit form with current profile data
    setEditForm({ ...profile });
    setErrors({});
    setTouched({});
    setIsEditing(true);
  };

  const handleInputChange = useCallback((field: keyof StudentProfile, value: string) => {
    // Use functional updates to prevent unnecessary re-renders
    setEditForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Real-time validation with debounce-like behavior
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [validateField]);

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.mobile,
      profile.emergency_contact_name,
      profile.emergency_contact_phone,
      profile.address_street,
      profile.address_district,
      profile.address_state,
      profile.address_pin_code
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
        <p className="text-gray-600">Please refresh the page or try again later.</p>
        <button 
          onClick={fetchProfile}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const EditableField = React.memo(({ 
    label, 
    value, 
    field, 
    type = 'text', 
    placeholder,
    required = false 
  }: {
    label: string;
    value: string;
    field: keyof StudentProfile;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => {
    const hasError = errors[field] && touched[field];
    const isValid = touched[field] && !errors[field] && (editForm[field] || '').trim() !== '';
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      handleInputChange(field, e.target.value);
    }, [field, handleInputChange]);
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isEditing ? (
          <div>
            <input
              type={type}
              value={editForm[field] || ''}
              onChange={handleChange}
              placeholder={placeholder}
              autoComplete="off"
              className={`w-full px-3 py-2 border-2 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                hasError 
                  ? 'border-red-500 bg-red-50' 
                  : isValid 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            />
            {hasError && (
              <div className="flex items-center mt-1 text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{errors[field]}</p>
              </div>
            )}
            {isValid && (
              <div className="flex items-center mt-1 text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">Looks good!</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-900 font-medium py-2">
            {value || <span className="text-gray-400 italic">Not provided</span>}
          </p>
        )}
      </div>
    );
  });

  const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <p className="text-gray-900 font-medium">{value || 'Not provided'}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || Object.values(errors).some(error => error !== '')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Profile Completion</h3>
              <p className="text-sm text-blue-700">
                Your profile is {calculateProfileCompletion()}% complete
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${calculateProfileCompletion()}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <ReadOnlyField label="Full Name" value={profile.student_name} />
            <ReadOnlyField label="Email Address" value={profile.email} />
            <EditableField 
              label="Roll Number" 
              value={profile.roll_number} 
              field="roll_number"
              placeholder="Enter your roll number"
            />
            <EditableField 
              label="Mobile Number" 
              value={profile.mobile} 
              field="mobile"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              required
            />
            <ReadOnlyField label="Date of Birth" value={profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not provided'} />
            <ReadOnlyField label="Gender" value={profile.gender} />
          </div>
        </div>

        {/* Emergency Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Emergency Contact</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Important Information</span>
            </div>
            <p className="text-sm text-red-700">
              This contact will be reached in case of emergencies during transport.
            </p>
          </div>
          
          <div className="space-y-4">
            <EditableField 
              label="Emergency Contact Name" 
              value={profile.emergency_contact_name} 
              field="emergency_contact_name"
              placeholder="Enter emergency contact name"
              required
            />
            <EditableField 
              label="Emergency Contact Phone" 
              value={profile.emergency_contact_phone} 
              field="emergency_contact_phone"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              required
            />
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Academic Information</h2>
          </div>
          <div className="space-y-4">
            <ReadOnlyField label="Institution" value={profile.institution_name} />
            <ReadOnlyField label="Department" value={profile.department_name} />
            <ReadOnlyField label="Program" value={profile.program_name} />
            <ReadOnlyField label="Degree" value={profile.degree_name} />
          </div>
        </div>

        {/* Family Information */}
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-purple-900">Family Information</h2>
          </div>
          <div className="space-y-4">
            <ReadOnlyField label="Father's Name" value={profile.father_name} />
            <EditableField 
              label="Father's Mobile" 
              value={profile.father_mobile} 
              field="father_mobile"
              type="tel"
              placeholder="Enter father's mobile number"
            />
            <ReadOnlyField label="Mother's Name" value={profile.mother_name} />
            <EditableField 
              label="Mother's Mobile" 
              value={profile.mother_mobile} 
              field="mother_mobile"
              type="tel"
              placeholder="Enter mother's mobile number"
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Home className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-orange-900">Address Information</h2>
          </div>
          <div className="space-y-4">
            <EditableField 
              label="Street Address" 
              value={profile.address_street} 
              field="address_street"
              placeholder="Enter your street address"
            />
            <EditableField 
              label="District" 
              value={profile.address_district} 
              field="address_district"
              placeholder="Enter your district"
            />
            <EditableField 
              label="State" 
              value={profile.address_state} 
              field="address_state"
              placeholder="Enter your state"
            />
            <EditableField 
              label="PIN Code" 
              value={profile.address_pin_code} 
              field="address_pin_code"
              placeholder="Enter 6-digit PIN code"
            />
          </div>
        </div>

        {/* Transport Information */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Bus className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Transport Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Transport Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                profile.transport_enrolled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {profile.transport_enrolled ? 'Enrolled' : 'Not Enrolled'}
              </span>
            </div>
            {profile.boarding_point && (
              <ReadOnlyField label="Boarding Point" value={profile.boarding_point} />
            )}
            {profile.quota_type && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Quota Type</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  profile.quota_type.is_government_quota 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {profile.quota_type.quota_name}
                </span>
              </div>
            )}
            {profile.transport_fee_amount && (
              <ReadOnlyField 
                label="Annual Transport Fee" 
                value={`₹${profile.transport_fee_amount.toLocaleString()}`} 
              />
            )}
            {profile.outstanding_amount !== undefined && (
              <ReadOnlyField 
                label="Outstanding Amount" 
                value={`₹${profile.outstanding_amount.toLocaleString()}`} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Profile History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profile History</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-gray-500 mb-1">Profile Created</label>
            <p className="text-gray-900 font-medium">{formatDate(profile.created_at)}</p>
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Last Updated</label>
            <p className="text-gray-900 font-medium">{formatDate(profile.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}