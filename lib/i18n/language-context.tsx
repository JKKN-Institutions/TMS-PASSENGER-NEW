'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'en' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load language preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('tms-driver-language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  // Save language preference to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms-driver-language', lang);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getTranslation(key, language);
    
    if (!params) return translation;
    
    // Replace parameters in translation
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
    }, translation);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation data
const translations: Record<string, Record<Language, string>> = {
  // Common
  'common.loading': {
    en: 'Loading...',
    ta: 'ஏற்றுகிறது...'
  },
  'common.error': {
    en: 'Error',
    ta: 'பிழை'
  },
  'common.success': {
    en: 'Success',
    ta: 'வெற்றி'
  },
  'common.save': {
    en: 'Save',
    ta: 'சேமி'
  },
  'common.cancel': {
    en: 'Cancel',
    ta: 'ரத்து செய்'
  },
  'common.edit': {
    en: 'Edit',
    ta: 'திருத்து'
  },
  'common.delete': {
    en: 'Delete',
    ta: 'நீக்கு'
  },
  'common.confirm': {
    en: 'Confirm',
    ta: 'உறுதிப்படுத்து'
  },
  'common.back': {
    en: 'Back',
    ta: 'பின்'
  },
  'common.next': {
    en: 'Next',
    ta: 'அடுத்து'
  },
  'common.close': {
    en: 'Close',
    ta: 'மூடு'
  },

  // Navigation
  'nav.dashboard': {
    en: 'Dashboard',
    ta: 'முகப்பு'
  },
  'nav.profile': {
    en: 'Profile',
    ta: 'சுயவிவரம்'
  },
  'nav.routes': {
    en: 'Routes',
    ta: 'பாதைகள்'
  },
  'nav.location': {
    en: 'Location',
    ta: 'இடம்'
  },
  'nav.schedules': {
    en: 'Schedules',
    ta: 'அட்டவணைகள்'
  },
  'nav.settings': {
    en: 'Settings',
    ta: 'அமைப்புகள்'
  },
  'nav.logout': {
    en: 'Logout',
    ta: 'வெளியேறு'
  },

  // Dashboard
  'dashboard.title': {
    en: 'Driver Dashboard',
    ta: 'ஓட்டுநர் முகப்பு'
  },
  'dashboard.welcome': {
    en: 'Welcome, {{name}}!',
    ta: 'வணக்கம், {{name}}!'
  },
  'dashboard.loading': {
    en: 'Loading driver dashboard...',
    ta: 'ஓட்டுநர் முகப்பு ஏற்றுகிறது...'
  },
  'dashboard.no_routes': {
    en: 'No routes assigned',
    ta: 'பாதைகள் ஒதுக்கப்படவில்லை'
  },
  'dashboard.assigned_routes': {
    en: 'Assigned Routes',
    ta: 'ஒதுக்கப்பட்ட பாதைகள்'
  },
  'dashboard.route_details': {
    en: 'Route Details',
    ta: 'பாதை விவரங்கள்'
  },
  'dashboard.total_stops': {
    en: 'Total Stops',
    ta: 'மொத்த நிறுத்தங்கள்'
  },
  'dashboard.active_students': {
    en: 'Active Students',
    ta: 'செயலில் உள்ள மாணவர்கள்'
  },

  // Profile
  'profile.title': {
    en: 'Driver Profile',
    ta: 'ஓட்டுநர் சுயவிவரம்'
  },
  'profile.loading': {
    en: 'Loading profile...',
    ta: 'சுயவிவரம் ஏற்றுகிறது...'
  },
  'profile.edit': {
    en: 'Edit Profile',
    ta: 'சுயவிவரம் திருத்து'
  },
  'profile.save_changes': {
    en: 'Save Changes',
    ta: 'மாற்றங்களை சேமி'
  },
  'profile.cancel_edit': {
    en: 'Cancel Edit',
    ta: 'திருத்தலை ரத்து செய்'
  },
  'profile.name': {
    en: 'Name',
    ta: 'பெயர்'
  },
  'profile.email': {
    en: 'Email',
    ta: 'மின்னஞ்சல்'
  },
  'profile.phone': {
    en: 'Phone',
    ta: 'தொலைபேசி'
  },
  'profile.license_number': {
    en: 'License Number',
    ta: 'உரிமம் எண்'
  },
  'profile.experience_years': {
    en: 'Experience (Years)',
    ta: 'அனுபவம் (ஆண்டுகள்)'
  },
  'profile.rating': {
    en: 'Rating',
    ta: 'மதிப்பீடு'
  },
  'profile.total_trips': {
    en: 'Total Trips',
    ta: 'மொத்த பயணங்கள்'
  },
  'profile.status': {
    en: 'Status',
    ta: 'நிலை'
  },
  'profile.joined_date': {
    en: 'Joined Date',
    ta: 'சேர்ந்த தேதி'
  },
  'profile.update_success': {
    en: 'Profile updated successfully',
    ta: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது'
  },
  'profile.update_error': {
    en: 'Failed to update profile',
    ta: 'சுயவிவரம் புதுப்பிக்க முடியவில்லை'
  },
  'profile.not_found': {
    en: 'Driver profile not found',
    ta: 'ஓட்டுநர் சுயவிவரம் கிடைக்கவில்லை'
  },
  'profile.load_error': {
    en: 'Failed to load profile',
    ta: 'சுயவிவரம் ஏற்ற முடியவில்லை'
  },

  // Location
  'location.title': {
    en: 'Location Tracking',
    ta: 'இடம் கண்காணிப்பு'
  },
  'location.enable': {
    en: 'Enable Location',
    ta: 'இடத்தை இயக்கு'
  },
  'location.disable': {
    en: 'Disable Location',
    ta: 'இடத்தை முடக்கு'
  },
  'location.sharing_enabled': {
    en: 'Location sharing enabled',
    ta: 'இட பகிர்வு இயக்கப்பட்டது'
  },
  'location.sharing_disabled': {
    en: 'Location sharing disabled',
    ta: 'இட பகிர்வு முடக்கப்பட்டது'
  },
  'location.current_location': {
    en: 'Current Location',
    ta: 'தற்போதைய இடம்'
  },
  'location.last_updated': {
    en: 'Last Updated',
    ta: 'கடைசியாக புதுப்பிக்கப்பட்டது'
  },

  // Routes
  'routes.title': {
    en: 'My Routes',
    ta: 'என் பாதைகள்'
  },
  'routes.route_number': {
    en: 'Route {{number}}',
    ta: 'பாதை {{number}}'
  },
  'routes.start_location': {
    en: 'Start: {{location}}',
    ta: 'தொடக்கம்: {{location}}'
  },
  'routes.end_location': {
    en: 'End: {{location}}',
    ta: 'முடிவு: {{location}}'
  },
  'routes.total_distance': {
    en: 'Distance: {{distance}} km',
    ta: 'தூரம்: {{distance}} கி.மீ'
  },
  'routes.estimated_time': {
    en: 'Time: {{time}} mins',
    ta: 'நேரம்: {{time}} நிமிடங்கள்'
  },

  // Language Switcher
  'language.switch': {
    en: 'Language',
    ta: 'மொழி'
  },
  'language.english': {
    en: 'English',
    ta: 'ஆங்கிலம்'
  },
  'language.tamil': {
    en: 'தமிழ்',
    ta: 'தமிழ்'
  },

  // Error Messages
  'error.network': {
    en: 'Network error. Please check your connection.',
    ta: 'நெட்வொர்க் பிழை. உங்கள் இணைப்பை சரிபார்க்கவும்.'
  },
  'error.unauthorized': {
    en: 'Unauthorized access. Please login again.',
    ta: 'அங்கீகரிக்கப்படாத அணுகல். மீண்டும் உள்நுழையவும்.'
  },
  'error.server': {
    en: 'Server error. Please try again later.',
    ta: 'சர்வர் பிழை. பின்னர் மீண்டும் முயற்சிக்கவும்.'
  },
  'error.driver_id_not_found': {
    en: 'Driver ID not found. Please contact support.',
    ta: 'ஓட்டுநர் அடையாள எண் கிடைக்கவில்லை. ஆதரவை தொடர்பு கொள்ளவும்.'
  },

  // Status
  'status.active': {
    en: 'Active',
    ta: 'செயலில்'
  },
  'status.inactive': {
    en: 'Inactive',
    ta: 'செயலற்ற'
  },
  'status.pending': {
    en: 'Pending',
    ta: 'நிலுவையில்'
  },
  'status.suspended': {
    en: 'Suspended',
    ta: 'இடைநிறுத்தப்பட்ட'
  },

  // Routes Page
  'routes.my_routes': {
    en: 'My Routes',
    ta: 'என் பாதைகள்'
  },
  'routes.manage_description': {
    en: 'Manage and view all your assigned transportation routes',
    ta: 'உங்கள் ஒதுக்கப்பட்ட போக்குவரத்து பாதைகளை நிர்வகிக்கவும் பார்க்கவும்'
  },
  'routes.total_routes': {
    en: 'Total Routes',
    ta: 'மொத்த பாதைகள்'
  },
  'routes.active_routes': {
    en: 'Active Routes',
    ta: 'செயலில் உள்ள பாதைகள்'
  },
  'routes.inactive_routes': {
    en: 'Inactive Routes',
    ta: 'செயலற்ற பாதைகள்'
  },
  'routes.route_details': {
    en: 'Route Details',
    ta: 'பாதை விவரங்கள்'
  },
  'routes.routes_assigned': {
    en: '{{count}} route{{plural}} assigned',
    ta: '{{count}} பாதை{{plural}} ஒதுக்கப்பட்டது'
  },
  'routes.no_routes_assigned': {
    en: 'No Routes Assigned',
    ta: 'பாதைகள் ஒதுக்கப்படவில்லை'
  },
  'routes.no_routes_description': {
    en: 'You haven\'t been assigned to any routes yet. Contact your administrator for route assignments.',
    ta: 'உங்களுக்கு இன்னும் எந்த பாதையும் ஒதுக்கப்படவில்லை. பாதை ஒதுக்கீட்டிற்கு உங்கள் நிர்வாகியைத் தொடர்பு கொள்ளவும்.'
  },
  'routes.vehicle': {
    en: 'Vehicle',
    ta: 'வாகனம்'
  },
  'routes.passengers': {
    en: 'Passengers',
    ta: 'பயணிகள்'
  },
  'routes.route_stops': {
    en: 'Route Stops',
    ta: 'பாதை நிறுத்தங்கள்'
  },
  'routes.view_bookings': {
    en: 'View Bookings',
    ta: 'முன்பதிவுகளைப் பார்க்கவும்'
  },
  'routes.start_tracking': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கவும்'
  },
  'routes.loading': {
    en: 'Loading your routes...',
    ta: 'உங்கள் பாதைகள் ஏற்றப்படுகின்றன...'
  },
  'routes.error_loading': {
    en: 'Error Loading Routes',
    ta: 'பாதைகள் ஏற்றுவதில் பிழை'
  },
  'routes.retry': {
    en: 'Retry',
    ta: 'மீண்டும் முயற்சிக்கவும்'
  },

  // Login Page
  'login.driver_login': {
    en: 'Driver Login',
    ta: 'ஓட்டுநர் உள்நுழைவு'
  },
  'login.direct_auth': {
    en: 'Direct authentication - No OAuth required',
    ta: 'நேரடி அங்கீகாரம் - OAuth தேவையில்லை'
  },
  'login.email_address': {
    en: 'Email Address',
    ta: 'மின்னஞ்சல் முகவரி'
  },
  'login.password': {
    en: 'Password',
    ta: 'கடவுச்சொல்'
  },
  'login.enter_email': {
    en: 'Enter your email',
    ta: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்'
  },
  'login.enter_password': {
    en: 'Enter your password',
    ta: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்'
  },
  'login.sign_in': {
    en: 'Sign in as Driver',
    ta: 'ஓட்டுநராக உள்நுழையவும்'
  },
  'login.signing_in': {
    en: 'Signing in...',
    ta: 'உள்நுழைகிறது...'
  },
  'login.creating_account': {
    en: 'Creating Account...',
    ta: 'கணக்கு உருவாக்கப்படுகிறது...'
  },
  'login.back_to_main': {
    en: '← Back to main login',
    ta: '← முக்கிய உள்நுழைவுக்கு திரும்பவும்'
  },
  'login.create_driver_account': {
    en: 'Create Driver Account',
    ta: 'ஓட்டுநர் கணக்கை உருவாக்கவும்'
  },
  'login.direct_auth_features': {
    en: 'Direct Authentication',
    ta: 'நேரடி அங்கீகாரம்'
  },
  'login.no_oauth': {
    en: '✅ No OAuth - bypasses parent app completely',
    ta: '✅ OAuth இல்லை - பெற்றோர் பயன்பாட்டை முழுமையாக தவிர்க்கிறது'
  },
  'login.no_token_errors': {
    en: '✅ No confirmation token errors',
    ta: '✅ உறுதிப்படுத்தல் டோக்கன் பிழைகள் இல்லை'
  },
  'login.direct_db_auth': {
    en: '✅ Direct database authentication',
    ta: '✅ நேரடி தரவுத்தள அங்கீகாரம்'
  },
  'login.works_offline': {
    en: '✅ Works even when parent app is down',
    ta: '✅ பெற்றோர் பயன்பாடு செயலிழந்தாலும் வேலை செய்கிறது'
  },

  // Location Page
  'location.location_settings': {
    en: 'Location Settings',
    ta: 'இட அமைப்புகள்'
  },
  'location.manage_sharing': {
    en: 'Manage your location sharing and tracking preferences',
    ta: 'உங்கள் இட பகிர்வு மற்றும் கண்காணிப்பு விருப்பங்களை நிர்வகிக்கவும்'
  },
  'location.location_sharing': {
    en: 'Location Sharing',
    ta: 'இட பகிர்வு'
  },
  'location.share_with_admin': {
    en: 'Share with Admin',
    ta: 'நிர்வாகியுடன் பகிரவும்'
  },
  'location.share_with_passengers': {
    en: 'Share with Passengers',
    ta: 'பயணிகளுடன் பகிரவும்'
  },
  'location.tracking_settings': {
    en: 'Tracking Settings',
    ta: 'கண்காணிப்பு அமைப்புகள்'
  },
  'location.update_interval': {
    en: 'Update Interval',
    ta: 'புதுப்பிப்பு இடைவெளி'
  },
  'location.seconds': {
    en: 'seconds',
    ta: 'விநாடிகள்'
  },
  'location.privacy_info': {
    en: 'Privacy Information',
    ta: 'தனியுரிமை தகவல்'
  },
  'location.privacy_description': {
    en: 'Your location data is encrypted and only shared with authorized personnel for safety and operational purposes.',
    ta: 'உங்கள் இட தரவு குறியாக்கம் செய்யப்பட்டு பாதுகாப்பு மற்றும் செயல்பாட்டு நோக்கங்களுக்காக அங்கீகரிக்கப்பட்ட பணியாளர்களுடன் மட்டுமே பகிரப்படுகிறது.'
  },

  // Live Tracking Page
  'tracking.live_tracking': {
    en: 'Live Tracking',
    ta: 'நேரடி கண்காணிப்பு'
  },
  'tracking.real_time_location': {
    en: 'Real-time location sharing for route management',
    ta: 'பாதை நிர்வாகத்திற்கான நேரடி இட பகிர்வு'
  },
  'tracking.start_tracking': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கவும்'
  },
  'tracking.stop_tracking': {
    en: 'Stop Tracking',
    ta: 'கண்காணிப்பை நிறுத்தவும்'
  },
  'tracking.tracking_active': {
    en: 'Tracking Active',
    ta: 'கண்காணிப்பு செயலில்'
  },
  'tracking.tracking_inactive': {
    en: 'Tracking Inactive',
    ta: 'கண்காணிப்பு செயலற்ற'
  },
  'tracking.current_location': {
    en: 'Current Location',
    ta: 'தற்போதைய இடம்'
  },
  'tracking.accuracy': {
    en: 'Accuracy',
    ta: 'துல்லியம்'
  },
  'tracking.meters': {
    en: 'meters',
    ta: 'மீட்டர்கள்'
  },
  'tracking.last_update': {
    en: 'Last Update',
    ta: 'கடைசி புதுப்பிப்பு'
  },
  'tracking.location_unavailable': {
    en: 'Location unavailable',
    ta: 'இடம் கிடைக்கவில்லை'
  },

  // Bookings Page
  'bookings.title': {
    en: 'Route Bookings',
    ta: 'பாதை முன்பதிவுகள்'
  },
  'bookings.manage_description': {
    en: 'View and manage passenger bookings for your assigned routes',
    ta: 'உங்கள் ஒதுக்கப்பட்ட பாதைகளுக்கான பயணிகள் முன்பதிவுகளைப் பார்க்கவும் நிர்வகிக்கவும்'
  },
  'bookings.total_bookings': {
    en: 'Total Bookings',
    ta: 'மொத்த முன்பதிவுகள்'
  },
  'bookings.confirmed': {
    en: 'Confirmed',
    ta: 'உறுதிப்படுத்தப்பட்டது'
  },
  'bookings.pending': {
    en: 'Pending',
    ta: 'நிலுவையில்'
  },
  'bookings.cancelled': {
    en: 'Cancelled',
    ta: 'ரத்து செய்யப்பட்டது'
  },
  'bookings.select_date': {
    en: 'Select Date',
    ta: 'தேதியைத் தேர்ந்தெடுக்கவும்'
  },
  'bookings.no_bookings': {
    en: 'No Bookings Found',
    ta: 'முன்பதிவுகள் எதுவும் கிடைக்கவில்லை'
  },
  'bookings.no_bookings_description': {
    en: 'No passenger bookings found for the selected date and route.',
    ta: 'தேர்ந்தெடுக்கப்பட்ட தேதி மற்றும் பாதைக்கு பயணிகள் முன்பதிவுகள் எதுவும் கிடைக்கவில்லை.'
  },
  'bookings.loading': {
    en: 'Loading bookings...',
    ta: 'முன்பதிவுகள் ஏற்றப்படுகின்றன...'
  },
  'bookings.error_loading': {
    en: 'Error Loading Bookings',
    ta: 'முன்பதிவுகள் ஏற்றுவதில் பிழை'
  },
  'bookings.student_name': {
    en: 'Student Name',
    ta: 'மாணவர் பெயர்'
  },
  'bookings.roll_number': {
    en: 'Roll Number',
    ta: 'பதிவு எண்'
  },
  'bookings.boarding_stop': {
    en: 'Boarding Stop',
    ta: 'ஏறும் நிறுத்தம்'
  },
  'bookings.booking_time': {
    en: 'Booking Time',
    ta: 'முன்பதிவு நேரம்'
  },

  // Common Actions
  'actions.refresh': {
    en: 'Refresh',
    ta: 'புதுப்பிக்கவும்'
  },
  'actions.try_again': {
    en: 'Try Again',
    ta: 'மீண்டும் முயற்சிக்கவும்'
  },
  'actions.go_to_dashboard': {
    en: 'Go to Dashboard',
    ta: 'முகப்புக்கு செல்லவும்'
  },
  'actions.view_details': {
    en: 'View Details',
    ta: 'விவரங்களைப் பார்க்கவும்'
  },

  // Time and Date
  'time.just_now': {
    en: 'Just now',
    ta: 'இப்போதே'
  },
  'time.minutes_ago': {
    en: '{{count}} minutes ago',
    ta: '{{count}} நிமிடங்களுக்கு முன்பு'
  },
  'time.hours_ago': {
    en: '{{count}} hours ago',
    ta: '{{count}} மணி நேரத்திற்கு முன்பு'
  },
  'time.days_ago': {
    en: '{{count}} days ago',
    ta: '{{count}} நாட்களுக்கு முன்பு'
  },

  // Network and Error Messages
  'error.network_error': {
    en: 'Network error. Please check your internet connection and refresh the page.',
    ta: 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து பக்கத்தைப் புதுப்பிக்கவும்.'
  },
  'error.timeout': {
    en: 'Request timed out. Please refresh the page and try again.',
    ta: 'கோரிக்கை நேரம் முடிந்தது. பக்கத்தைப் புதுப்பித்து மீண்டும் முயற்சிக்கவும்.'
  },
  'error.session_expired': {
    en: 'Session expired. Please log in again.',
    ta: 'அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.'
  },
  'error.access_denied': {
    en: 'Access denied. Contact administrator for assistance.',
    ta: 'அணுகல் மறுக்கப்பட்டது. உதவிக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்.'
  },
  'error.not_found': {
    en: 'Resource not found. Please contact administrator.',
    ta: 'வளம் கிடைக்கவில்லை. நிர்வாகியைத் தொடர்பு கொள்ளவும்.'
  },
  'error.server_error': {
    en: 'Server error. Please try again later or contact support.',
    ta: 'சர்வர் பிழை. பின்னர் மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.'
  },
  'error.driver_info_not_found': {
    en: 'Driver information not found',
    ta: 'ஓட்டுநர் தகவல் கிடைக்கவில்லை'
  },
  'error.only_drivers_access': {
    en: 'Only drivers can access this feature',
    ta: 'ஓட்டுநர்கள் மட்டுமே இந்த அம்சத்தை அணுக முடியும்'
  },
  'error.login_required': {
    en: 'Please log in to access this feature',
    ta: 'இந்த அம்சத்தை அணுக உள்நுழையவும்'
  },

  // Driver Page Specific
  'driver.journey_start': {
    en: 'Ready to start your journey? Enable location sharing and begin tracking.',
    ta: 'உங்கள் பயணத்தைத் தொடங்க தயாரா? இருப்பிட பகிர்வை இயக்கி கண்காணிப்பைத் தொடங்கவும்.'
  },
  'driver.location_sharing_title': {
    en: 'Live Location Sharing',
    ta: 'நேரடி இருப்பிட பகிர்வு'
  },
  'driver.location_sharing_active': {
    en: 'Location is being shared with passengers',
    ta: 'இருப்பிடம் பயணிகளுடன் பகிரப்படுகிறது'
  },
  'driver.location_sharing_inactive': {
    en: 'Start sharing your live location',
    ta: 'உங்கள் நேரடி இருப்பிடத்தைப் பகிரத் தொடங்குங்கள்'
  },
  'driver.stop_sharing': {
    en: 'Stop Sharing',
    ta: 'பகிர்வை நிறுத்து'
  },
  'driver.start_sharing': {
    en: 'Start Sharing',
    ta: 'பகிர்வைத் தொடங்கு'
  },
  'driver.route_stops': {
    en: 'Route Stops',
    ta: 'வழித்தடை நிறுத்தங்கள்'
  },
  'driver.stops_count': {
    en: 'Stops',
    ta: 'நிறுத்தங்கள்'
  },

  // Bookings Module
  'bookings.total_bookings': {
    en: 'Total Bookings',
    ta: 'மொத்த பதிவுகள்'
  },
  'bookings.confirmed': {
    en: 'Confirmed',
    ta: 'உறுதி செய்யப்பட்டது'
  },
  'bookings.pending': {
    en: 'Pending',
    ta: 'நிலுவையில்'
  },
  'bookings.cancelled': {
    en: 'Cancelled',
    ta: 'ரத்து செய்யப்பட்டது'
  },
  'bookings.paid': {
    en: 'Paid',
    ta: 'செலுத்தப்பட்டது'
  },
  'bookings.verified': {
    en: 'Verified',
    ta: 'சரிபார்க்கப்பட்டது'
  },
  'bookings.roll': {
    en: 'Roll',
    ta: 'வகுப்பு எண்'
  },
  'bookings.seat': {
    en: 'Seat',
    ta: 'இருக்கை'
  },
  'bookings.all_status': {
    en: 'All Status',
    ta: 'அனைத்து நிலை'
  },
  'bookings.verified_at': {
    en: 'Verified at',
    ta: 'சரிபார்க்கப்பட்ட நேரம்'
  },
  'common.by': {
    en: 'by',
    ta: 'மூலம்'
  },
  'common.refresh': {
    en: 'Refresh Now',
    ta: 'புதுப்பிக்கவும்'
  }
};

function getTranslation(key: string, language: Language): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  return translation[language] || translation['en'] || key;
}
