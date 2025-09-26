'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { EnhancedInput, validators } from '@/components/enhanced-form-components';

// Stable input component to prevent focus loss
const StableInput = React.memo(({ 
  label, 
  value, 
  onChange, 
  onBlur,
  type = 'text', 
  placeholder,
  required = false,
  error,
  icon: Icon
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: any;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            placeholder-gray-400 focus:outline-none focus:ring-1
            transition-colors duration-200
          `.trim()}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

// Simple EditableField component with direct HTML input to prevent focus loss
const EditableField = ({ 
  label, 
  value, 
  field, 
  type = 'text', 
  placeholder,
  required = false,
  icon,
  isEditing,
  editForm,
  errors,
  onInputChange
}: {
  label: string;
  value: string;
  field: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: any;
  isEditing: boolean;
  editForm: any;
  errors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}) => {
  const fieldError = errors[field];
  const fieldValue = editForm[field] || '';
  
  return (
    <div>
      {isEditing ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {React.createElement(icon, { className: "h-5 w-5 text-gray-400" })}
              </div>
            )}
            <input
              type={type}
              value={fieldValue}
              onChange={(e) => onInputChange(field, e.target.value)}
              placeholder={placeholder}
              className={`
                block w-full rounded-lg border px-3 py-2 text-sm
                ${icon ? 'pl-10' : ''}
                ${fieldError 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }
                placeholder-gray-400 focus:outline-none focus:ring-1
                transition-colors duration-200
              `.trim()}
            />
          </div>
          {fieldError && (
            <p className="mt-1 text-sm text-red-600">{fieldError}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
          <p className="text-gray-900 font-medium py-2">
            {value || <span className="text-gray-400 italic">Not provided</span>}
          </p>
        </div>
      )}
    </div>
  );
};

EditableField.displayName = 'EditableField';

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

  // Enhanced validation with better user experience
  const fieldValidators = useMemo(() => ({
    mobile: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.phone(value) || undefined;
    },
    emergency_contact_phone: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.phone(value) || undefined;
    },
    father_mobile: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.phone(value) || undefined;
    },
    mother_mobile: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.phone(value) || undefined;
    },
    address_pin_code: (value: string) => {
      if (!value?.trim()) return undefined;
      const pinRegex = /^\d{6}$/;
      return pinRegex.test(value) ? undefined : 'Enter a valid 6-digit PIN code';
    },
    emergency_contact_name: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.minLength(2)(value) || undefined;
    },
    roll_number: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.minLength(3)(value) || undefined;
    },
    address_street: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.minLength(5)(value) || undefined;
    },
    address_district: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.minLength(2)(value) || undefined;
    },
    address_state: (value: string) => {
      if (!value?.trim()) return undefined;
      return validators.minLength(2)(value) || undefined;
    }
  }), []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all form fields using enhanced validators
    Object.keys(editForm).forEach(key => {
      const field = key as keyof StudentProfile;
      const value = editForm[field] as string;
      const validator = fieldValidators[field as keyof typeof fieldValidators];
      
      if (validator) {
        const error = validator(value || '');
        if (error) {
          newErrors[field] = error;
        }
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
        // Handle validation errors from API
        if (data.validationErrors) {
          setErrors(data.validationErrors);
          toast.error('Please fix the validation errors and try again');
          return;
        }
        throw new Error(data.error || 'Failed to update profile');
      }

      if (data.success) {
        // Update profile with the returned data from server
        setProfile(data.data || { ...profile!, ...editForm });
        setEditForm({});
        setErrors({});
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
    // Reset form to original profile data
    setEditForm({ ...profile });
    setErrors({}); // Clear any validation errors
    setIsEditing(false);
    toast.info('Changes discarded');
  };

  const startEditing = () => {
    // Initialize edit form with current profile data
    setEditForm({ ...profile });
    setErrors({}); // Clear any previous validation errors
    setIsEditing(true);
  };

  // Simple input change handler - only update form data, no validation
  const handleInputChange = useCallback((field: keyof StudentProfile, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // No need for blur validation - only validate on submit

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
              icon={BookOpen}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <EditableField 
              label="Mobile Number" 
              value={profile.mobile} 
              field="mobile"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              required
              icon={Phone}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
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
              icon={User}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <EditableField 
              label="Emergency Contact Phone" 
              value={profile.emergency_contact_phone} 
              field="emergency_contact_phone"
              type="tel"
              placeholder="Enter 10-digit mobile number"
              required
              icon={Phone}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
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
              icon={Phone}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <ReadOnlyField label="Mother's Name" value={profile.mother_name} />
            <EditableField 
              label="Mother's Mobile" 
              value={profile.mother_mobile} 
              field="mother_mobile"
              type="tel"
              placeholder="Enter mother's mobile number"
              icon={Phone}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
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
              icon={Home}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <EditableField 
              label="District" 
              value={profile.address_district} 
              field="address_district"
              placeholder="Enter your district"
              icon={MapPin}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <EditableField 
              label="State" 
              value={profile.address_state} 
              field="address_state"
              placeholder="Enter your state"
              icon={MapPin}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
            />
            <EditableField 
              label="PIN Code" 
              value={profile.address_pin_code} 
              field="address_pin_code"
              placeholder="Enter 6-digit PIN code"
              icon={MapPin}
              isEditing={isEditing}
              editForm={editForm}
              errors={errors}
              onInputChange={handleInputChange}
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