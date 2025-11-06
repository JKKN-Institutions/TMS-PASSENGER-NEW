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
  'common.search': {
    en: 'Search',
    ta: 'தேடு'
  },
  'common.all_routes': {
    en: 'All Routes',
    ta: 'அனைத்து பாதைகள்'
  },
  'common.showing': {
    en: 'Showing',
    ta: 'காண்பிக்கிறது'
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
  'nav.passengers': {
    en: 'Passengers',
    ta: 'பயணிகள்'
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

  // Driver Passengers Module
  'driver.passengers.total': {
    en: 'Total Passengers',
    ta: 'மொத்த பயணிகள்'
  },
  'driver.passengers.active': {
    en: 'Active Passengers',
    ta: 'செயலில் உள்ள பயணிகள்'
  },
  'driver.passengers.total_bookings': {
    en: 'Total Bookings',
    ta: 'மொத்த முன்பதிவுகள்'
  },
  'driver.passengers.passengers': {
    en: 'passengers',
    ta: 'பயணிகள்'
  },
  'driver.passengers.routes': {
    en: 'Routes',
    ta: 'பாதைகள்'
  },
  'driver.passengers.bookings': {
    en: 'Bookings',
    ta: 'முன்பதிவுகள்'
  },
  'driver.passengers.stops': {
    en: 'Stops',
    ta: 'நிறுத்தங்கள்'
  },
  'driver.passengers.contact_info': {
    en: 'Contact Information',
    ta: 'தொடர்பு தகவல்'
  },
  'driver.passengers.assigned_routes': {
    en: 'Assigned Routes',
    ta: 'ஒதுக்கப்பட்ட பாதைகள்'
  },
  'driver.passengers.boarding_stops': {
    en: 'Boarding Stops',
    ta: 'ஏறும் நிறுத்தங்கள்'
  },
  'driver.passengers.no_results': {
    en: 'No Results Found',
    ta: 'முடிவுகள் இல்லை'
  },
  'driver.passengers.no_passengers': {
    en: 'No Passengers',
    ta: 'பயணிகள் இல்லை'
  },
  'driver.passengers.no_passengers_message': {
    en: 'No passengers found for your assigned routes.',
    ta: 'உங்கள் ஒதுக்கப்பட்ட பாதைகளுக்கு பயணிகள் இல்லை.'
  },
  'driver.passengers.try_different_filter': {
    en: 'Try adjusting your search or filter criteria.',
    ta: 'உங்கள் தேடல் அல்லது வடிகட்டி அளவுகோல்களை மாற்றி முயற்சிக்கவும்.'
  },

  // Page Headers & Descriptions
  'page.dashboard.title': {
    en: 'Driver Dashboard',
    ta: 'ஓட்டுநர் முகப்பு'
  },
  'page.dashboard.subtitle': {
    en: 'Overview of your routes and activities',
    ta: 'உங்கள் பாதைகள் மற்றும் நடவடிக்கைகளின் கண்ணோட்டம்'
  },
  'page.routes.title': {
    en: 'My Routes',
    ta: 'எனது பாதைகள்'
  },
  'page.routes.subtitle': {
    en: 'Manage and view your assigned routes',
    ta: 'உங்கள் ஒதுக்கப்பட்ட பாதைகளை நிர்வகிக்கவும் பார்க்கவும்'
  },
  'page.route_details.title': {
    en: 'Route Details',
    ta: 'பாதை விவரங்கள்'
  },
  'page.route_details.subtitle': {
    en: 'Complete information about this route',
    ta: 'இந்த பாதை பற்றிய முழு தகவல்'
  },
  'page.passengers.title': {
    en: 'Passengers',
    ta: 'பயணிகள்'
  },
  'page.passengers.subtitle': {
    en: 'View and manage passengers on your routes',
    ta: 'உங்கள் பாதைகளில் உள்ள பயணிகளை பார்க்கவும் நிர்வகிக்கவும்'
  },
  'page.bookings.title': {
    en: 'Bookings',
    ta: 'முன்பதிவுகள்'
  },
  'page.bookings.subtitle': {
    en: 'Manage passenger bookings and reservations',
    ta: 'பயணிகள் முன்பதிவுகள் மற்றும் இடஒதுக்கீடுகளை நிர்வகிக்கவும்'
  },
  'page.live_tracking.title': {
    en: 'Live Tracking',
    ta: 'நேரடி கண்காணிப்பு'
  },
  'page.live_tracking.subtitle': {
    en: 'Track your current location and route progress',
    ta: 'உங்கள் தற்போதைய இடம் மற்றும் பாதை முன்னேற்றத்தை கண்காணிக்கவும்'
  },
  'page.profile.title': {
    en: 'My Profile',
    ta: 'எனது சுயவிவரம்'
  },
  'page.profile.subtitle': {
    en: 'View and update your personal information',
    ta: 'உங்கள் தனிப்பட்ட தகவலை பார்க்கவும் புதுப்பிக்கவும்'
  },
  'page.location.title': {
    en: 'Location Sharing',
    ta: 'இடம் பகிர்வு'
  },
  'page.location.subtitle': {
    en: 'Manage your location sharing settings',
    ta: 'உங்கள் இட பகிர்வு அமைப்புகளை நிர்வகிக்கவும்'
  },

  // Location Sharing
  'location.sharing': {
    en: 'Sharing',
    ta: 'பகிர்கிறது'
  },
  'location.not_sharing': {
    en: 'Not Sharing',
    ta: 'பகிரவில்லை'
  },
  'location.error': {
    en: 'Error',
    ta: 'பிழை'
  },
  'location.start': {
    en: 'Start',
    ta: 'தொடங்கு'
  },
  'location.stop': {
    en: 'Stop',
    ta: 'நிறுத்து'
  },
  'location.error_title': {
    en: 'Location Sharing Error',
    ta: 'இடம் பகிர்வு பிழை'
  },
  'location.error_offline': {
    en: 'You are offline. Please check your internet connection.',
    ta: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.'
  },
  'location.error_not_supported': {
    en: 'Location services are not supported by your device.',
    ta: 'இருப்பிட சேவைகள் உங்கள் சாதனத்தில் ஆதரிக்கப்படவில்லை.'
  },
  'location.error_permission_denied': {
    en: 'Location permission denied. Please enable location access in your browser settings.',
    ta: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. உங்கள் உலாவி அமைப்புகளில் இருப்பிட அணுகலை இயக்கவும்.'
  },
  'location.error_permission_help': {
    en: 'Go to browser settings → Privacy & Security → Location',
    ta: 'உலாவி அமைப்புகள் → தனியுரிமை மற்றும் பாதுகாப்பு → இருப்பிடம்'
  },
  'location.error_position_unavailable': {
    en: 'Location position unavailable. Please try again.',
    ta: 'இருப்பிட நிலை கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
  },
  'location.error_timeout': {
    en: 'Location request timed out. Please try again.',
    ta: 'இருப்பிட கோரிக்கை காலாவதியானது. மீண்டும் முயற்சிக்கவும்.'
  },
  'location.error_unknown': {
    en: 'An unknown error occurred. Please try again.',
    ta: 'அறியப்படாத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
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
  },
  'common.retry': {
    en: 'Retry',
    ta: 'மீண்டும் முயற்சிக்கவும்'
  },

  // Profile Page - Additional translations
  'profile.driver_profile': {
    en: 'Driver Profile',
    ta: 'ஓட்டுநர் சுயவிவரம்'
  },
  'profile.manage_account': {
    en: 'Manage your account information and view your performance statistics',
    ta: 'உங்கள் கணக்கு தகவலை நிர்வகித்து செயல்திறன் புள்ளிவிவரங்களைப் பார்க்கவும்'
  },
  'profile.management': {
    en: 'Profile Management',
    ta: 'சுயவிவர நிர்வாகம்'
  },
  'profile.update_info': {
    en: 'Update your personal information and preferences',
    ta: 'உங்கள் தனிப்பட்ட தகவல் மற்றும் விருப்பங்களை புதுப்பிக்கவும்'
  },
  'profile.personal_info': {
    en: 'Personal Information',
    ta: 'தனிப்பட்ட தகவல்'
  },
  'profile.basic_details': {
    en: 'Your basic account details',
    ta: 'உங்கள் அடிப்படை கணக்கு விவரங்கள்'
  },
  'profile.full_name': {
    en: 'Full Name',
    ta: 'முழு பெயர்'
  },
  'profile.email_address': {
    en: 'Email Address',
    ta: 'மின்னஞ்சல் முகவரி'
  },
  'profile.phone_number': {
    en: 'Phone Number',
    ta: 'தொலைபேசி எண்'
  },
  'profile.enter_name': {
    en: 'Enter your full name',
    ta: 'உங்கள் முழு பெயரை உள்ளிடவும்'
  },
  'profile.enter_phone': {
    en: 'Enter your phone number',
    ta: 'உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்'
  },
  'profile.enter_license': {
    en: 'Enter your license number',
    ta: 'உங்கள் உரிமம் எண்ணை உள்ளிடவும்'
  },
  'profile.saving': {
    en: 'Saving...',
    ta: 'சேமிக்கிறது...'
  },
  'profile.performance_stats': {
    en: 'Performance Statistics',
    ta: 'செயல்திறன் புள்ளிவிவரங்கள்'
  },
  'profile.driving_metrics': {
    en: 'Your driving performance metrics',
    ta: 'உங்கள் ஓட்டுநர் செயல்திறன் அளவீடுகள்'
  },
  'profile.years_experience': {
    en: 'Years Experience',
    ta: 'ஆண்டுகள் அனுபவம்'
  },
  'profile.account_actions': {
    en: 'Account Actions',
    ta: 'கணக்கு செயல்கள்'
  },
  'profile.manage_settings': {
    en: 'Manage your account settings',
    ta: 'உங்கள் கணக்கு அமைப்புகளை நிர்வகிக்கவும்'
  },
  'profile.sign_out': {
    en: 'Sign Out',
    ta: 'வெளியேறு'
  },
  'profile.logout_account': {
    en: 'Logout from your account',
    ta: 'உங்கள் கணக்கிலிருந்து வெளியேறு'
  },
  'profile.unable_to_load': {
    en: 'Unable to load driver profile.',
    ta: 'ஓட்டுநர் சுயவிவரத்தை ஏற்ற முடியவில்லை.'
  },
  'profile.what_happened': {
    en: 'What happened:',
    ta: 'என்ன நடந்தது:'
  },
  'profile.auth_working': {
    en: 'Your authentication is working correctly',
    ta: 'உங்கள் அங்கீகாரம் சரியாக செயல்படுகிறது'
  },
  'profile.attempted_create': {
    en: 'We attempted to create a driver profile automatically',
    ta: 'நாங்கள் தானாக ஓட்டுநர் சுயவிவரத்தை உருவாக்க முயற்சித்தோம்'
  },
  'profile.creation_failed': {
    en: 'The profile creation may have failed or needs admin approval',
    ta: 'சுயவிவர உருவாக்கம் தோல்வியடைந்திருக்கலாம் அல்லது நிர்வாகி ஒப்புதல் தேவை'
  },
  'profile.contact_admin': {
    en: 'Please contact the transport admin to complete your profile setup',
    ta: 'உங்கள் சுயவிவர அமைப்பை முடிக்க போக்குவரத்து நிர்வாகியைத் தொடர்பு கொள்ளவும்'
  },
  'profile.for_admin': {
    en: 'For Admin: Check if driver ID matches the drivers table or create a manual entry.',
    ta: 'நிர்வாகிக்கு: ஓட்டுநர் ஐடி டிரைவர்ஸ் அட்டவணையுடன் பொருந்துகிறதா என சரிபார்க்கவும் அல்லது கைமுறை பதிவு உருவாக்கவும்.'
  },

  // Layout Page
  'layout.driver_dashboard_title': {
    en: 'Driver Dashboard',
    ta: 'ஓட்டுநர் முகப்பு'
  },
  'layout.loading_dashboard': {
    en: 'Loading your dashboard...',
    ta: 'உங்கள் முகப்பு ஏற்றுகிறது...'
  },
  'layout.driver_app': {
    en: 'Driver App',
    ta: 'ஓட்டுநர் பயன்பாடு'
  },
  'layout.professional_driver': {
    en: 'Professional Driver',
    ta: 'தொழில்முறை ஓட்டுநர்'
  },

  // Location Page
  'location.location_tracking_title': {
    en: 'Location Tracking',
    ta: 'இடம் கண்காணிப்பு'
  },
  'location.realtime_sharing': {
    en: 'Real-time location sharing for passengers and administrators',
    ta: 'பயணிகள் மற்றும் நிர்வாகிகளுக்கான நேரடி இட பகிர்வு'
  },
  'location.sharing_enabled_status': {
    en: 'Sharing Enabled',
    ta: 'பகிர்வு இயக்கப்பட்டது'
  },
  'location.current_status': {
    en: 'Current Status',
    ta: 'தற்போதைய நிலை'
  },
  'location.update_interval_label': {
    en: 'Update Interval:',
    ta: 'புதுப்பிப்பு இடைவெளி:'
  },
  'location.tracking_label': {
    en: 'Tracking:',
    ta: 'கண்காணிப்பு:'
  },
  'location.live_location': {
    en: 'Live Location',
    ta: 'நேரடி இடம்'
  },
  'location.access_denied': {
    en: 'Access Denied',
    ta: 'அணுகல் மறுக்கப்பட்டது'
  },
  'location.login_required_msg': {
    en: 'Please log in to access location settings.',
    ta: 'இட அமைப்புகளை அணுக உள்நுழையவும்.'
  },
  'location.drivers_only': {
    en: 'Only drivers can access location settings.',
    ta: 'ஓட்டுநர்கள் மட்டுமே இட அமைப்புகளை அணுக முடியும்.'
  },
  'location.info_not_found': {
    en: 'Driver Information Not Found',
    ta: 'ஓட்டுநர் தகவல் கிடைக்கவில்லை'
  },
  'location.unable_retrieve': {
    en: 'Unable to retrieve driver information. Please try logging in again.',
    ta: 'ஓட்டுநர் தகவலை மீட்டெடுக்க முடியவில்லை. மீண்டும் உள்நுழைய முயற்சிக்கவும்.'
  },
  'location.loading_settings': {
    en: 'Loading location settings...',
    ta: 'இட அமைப்புகள் ஏற்றுகிறது...'
  },

  // Live Tracking Page
  'tracking.live_location_tracking': {
    en: 'Live Location Tracking',
    ta: 'நேரடி இட கண்காணிப்பு'
  },
  'tracking.share_realtime': {
    en: 'Share your real-time location with passengers and administrators',
    ta: 'பயணிகள் மற்றும் நிர்வாகிகளுடன் உங்கள் நேரடி இருப்பிடத்தைப் பகிரவும்'
  },
  'tracking.tracking_status': {
    en: 'Tracking Status',
    ta: 'கண்காணிப்பு நிலை'
  },
  'tracking.location_status': {
    en: 'Location Status',
    ta: 'இட நிலை'
  },
  'tracking.available': {
    en: 'Available',
    ta: 'கிடைக்கிறது'
  },
  'tracking.not_available': {
    en: 'Not Available',
    ta: 'கிடைக்கவில்லை'
  },
  'tracking.driver': {
    en: 'Driver',
    ta: 'ஓட்டுநர்'
  },
  'tracking.controls': {
    en: 'Tracking Controls',
    ta: 'கண்காணிப்பு கட்டுப்பாடுகள்'
  },
  'tracking.start_stop': {
    en: 'Start or stop location sharing',
    ta: 'இட பகிர்வைத் தொடங்கவும் அல்லது நிறுத்தவும்'
  },
  'tracking.stop': {
    en: 'Stop Tracking',
    ta: 'கண்காணிப்பை நிறுத்து'
  },
  'tracking.start': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கு'
  },
  'tracking.status_label': {
    en: 'Status:',
    ta: 'நிலை:'
  },
  'tracking.active': {
    en: 'Tracking Active',
    ta: 'கண்காணிப்பு செயலில்'
  },
  'tracking.stopped': {
    en: 'Tracking Stopped',
    ta: 'கண்காணிப்பு நிறுத்தப்பட்டது'
  },
  'tracking.location_label': {
    en: 'Location:',
    ta: 'இடம்:'
  },
  'tracking.gps_available': {
    en: 'GPS Signal Available',
    ta: 'GPS சிக்னல் கிடைக்கிறது'
  },
  'tracking.gps_not_available': {
    en: 'GPS Signal Not Available',
    ta: 'GPS சிக்னல் கிடைக்கவில்லை'
  },
  'tracking.coordinates': {
    en: 'Coordinates',
    ta: 'ஆயத்தொகுப்புகள்'
  },
  'tracking.latitude': {
    en: 'Latitude:',
    ta: 'அட்சரேகை:'
  },
  'tracking.longitude': {
    en: 'Longitude:',
    ta: 'தீர்க்கரேகை:'
  },
  'tracking.details': {
    en: 'Details',
    ta: 'விவரங்கள்'
  },
  'tracking.updated': {
    en: 'Updated:',
    ta: 'புதுப்பிக்கப்பட்டது:'
  },
  'tracking.location_tracker': {
    en: 'Location Tracker',
    ta: 'இட கண்காணிப்பாளர்'
  },
  'tracking.realtime_gps': {
    en: 'Real-time GPS location sharing system',
    ta: 'நேரடி GPS இட பகிர்வு அமைப்பு'
  },
  'tracking.how_it_works': {
    en: 'How Live Tracking Works',
    ta: 'நேரடி கண்காணிப்பு எவ்வாறு செயல்படுகிறது'
  },
  'tracking.enable_description': {
    en: 'Enable live tracking to share your real-time location with passengers and administrators. Your location will be updated automatically and can be viewed on the map in real-time.',
    ta: 'பயணிகள் மற்றும் நிர்வாகிகளுடன் உங்கள் நேரடி இருப்பிடத்தைப் பகிர நேரடி கண்காணிப்பை இயக்கவும். உங்கள் இருப்பிடம் தானாகவே புதுப்பிக்கப்படும் மற்றும் வரைபடத்தில் நேரடியாகப் பார்க்கலாம்.'
  },
  'tracking.click_start': {
    en: 'Click "Start Tracking" to begin sharing your location',
    ta: 'உங்கள் இருப்பிடத்தைப் பகிரத் தொடங்க "கண்காணிப்பைத் தொடங்கு" என்பதைக் கிளிக் செய்யவும்'
  },
  'tracking.gps_update': {
    en: 'Your GPS coordinates will be updated every few seconds',
    ta: 'உங்கள் GPS ஆயத்தொகுப்புகள் ஒவ்வொரு சில விநாடிகளுக்கும் புதுப்பிக்கப்படும்'
  },
  'tracking.passengers_see': {
    en: 'Passengers can see your live location on their app',
    ta: 'பயணிகள் தங்கள் பயன்பாட்டில் உங்கள் நேரடி இருப்பிடத்தைப் பார்க்கலாம்'
  },
  'tracking.admin_monitor': {
    en: 'Administrators can monitor your route progress',
    ta: 'நிர்வாகிகள் உங்கள் பாதை முன்னேற்றத்தைக் கண்காணிக்கலாம்'
  },
  'tracking.loading_live': {
    en: 'Loading live tracking...',
    ta: 'நேரடி கண்காணிப்பு ஏற்றுகிறது...'
  },
  'tracking.login_access': {
    en: 'Please log in to access live tracking.',
    ta: 'நேரடி கண்காணிப்பை அணுக உள்நுழையவும்.'
  },
  'tracking.drivers_only_access': {
    en: 'Only drivers can access live tracking.',
    ta: 'ஓட்டுநர்கள் மட்டுமே நேரடி கண்காணிப்பை அணுக முடியும்.'
  },

  // Bookings Page - Additional translations
  'bookings.passenger_bookings': {
    en: 'Passenger Bookings',
    ta: 'பயணிகள் முன்பதிவுகள்'
  },
  'bookings.sample_route': {
    en: '(Sample: Route 29)',
    ta: '(மாதிரி: பாதை 29)'
  },
  'bookings.manage_all': {
    en: 'Manage and view all passenger bookings for your routes',
    ta: 'உங்கள் பாதைகளுக்கான அனைத்து பயணிகள் முன்பதிவுகளையும் நிர்வகித்து பார்க்கவும்'
  },
  'bookings.showing_for': {
    en: 'Showing bookings for:',
    ta: 'முன்பதிவுகள் காட்டப்படுகின்றன:'
  },
  'bookings.date_selection': {
    en: 'Date Selection',
    ta: 'தேதி தேர்வு'
  },
  'bookings.auto_update': {
    en: 'Bookings automatically update when date changes',
    ta: 'தேதி மாறும்போது முன்பதிவுகள் தானாகவே புதுப்பிக்கப்படும்'
  },
  'bookings.quick_select': {
    en: 'Quick select:',
    ta: 'விரைவு தேர்வு:'
  },
  'bookings.yesterday': {
    en: 'Yesterday',
    ta: 'நேற்று'
  },
  'bookings.today': {
    en: 'Today',
    ta: 'இன்று'
  },
  'bookings.tomorrow': {
    en: 'Tomorrow',
    ta: 'நாளை'
  },
  'bookings.no_bookings_found': {
    en: 'No Bookings Found',
    ta: 'முன்பதிவுகள் எதுவும் கிடைக்கவில்லை'
  },
  'bookings.try_different_date': {
    en: 'No bookings available for the selected date. Try selecting a different date or check your route assignments.',
    ta: 'தேர்ந்தெடுக்கப்பட்ட தேதிக்கு முன்பதிவுகள் இல்லை. வேறு தேதியைத் தேர்ந்தெடுக்க முயற்சிக்கவும் அல்லது உங்கள் பாதை ஒதுக்கீடுகளைச் சரிபார்க்கவும்.'
  },
  'bookings.student': {
    en: 'Student',
    ta: 'மாணவர்'
  },
  'bookings.booking_s': {
    en: 'booking',
    ta: 'முன்பதிவு'
  },
  'bookings.bookings_plural': {
    en: 'bookings',
    ta: 'முன்பதிவுகள்'
  },

  // Login Page - Additional translations
  'login.account_created': {
    en: 'Driver account created successfully! You can now login.',
    ta: 'ஓட்டுநர் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! இப்போது உள்நுழையலாம்.'
  },
  'login.login_failed': {
    en: 'Login failed. Please try again.',
    ta: 'உள்நுழைவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
  },
  'login.invalid_credentials': {
    en: 'Invalid credentials. Please check your email and password.',
    ta: 'தவறான சான்றுகள். உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லை சரிபார்க்கவும்.'
  },
  'login.invalid_email_password': {
    en: 'Invalid email or password. Please try again.',
    ta: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.'
  },
  'login.success_redirecting': {
    en: 'Redirecting to driver dashboard...',
    ta: 'ஓட்டுநர் முகப்புக்கு திருப்பிவிடப்படுகிறது...'
  },

  // Additional Live Tracking Translations
  'tracking.live_location_tracking_header': {
    en: 'Live Location Tracking',
    ta: 'நேரடி இட கண்காணிப்பு'
  },
  'tracking.share_realtime_description': {
    en: 'Share your real-time location with passengers and administrators',
    ta: 'பயணிகள் மற்றும் நிர்வாகிகளுடன் உங்கள் நேரடி இருப்பிடத்தைப் பகிரவும்'
  },
  'tracking.inactive_status': {
    en: 'Inactive',
    ta: 'செயலற்றது'
  },
  'tracking.active_status': {
    en: 'Active',
    ta: 'செயலில்'
  },
  'tracking.pause': {
    en: 'Stop Tracking',
    ta: 'கண்காணிப்பை நிறுத்து'
  },
  'tracking.play': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கு'
  },
  'tracking.current_location_header': {
    en: 'Current Location',
    ta: 'தற்போதைய இடம்'
  },
  'tracking.location_tracker_header': {
    en: 'Location Tracker',
    ta: 'இட கண்காணிப்பாளர்'
  },
  'tracking.realtime_gps_system': {
    en: 'Real-time GPS location sharing system',
    ta: 'நேரடி GPS இட பகிர்வு அமைப்பு'
  },

  // Additional Bookings Translations
  'bookings.passenger_bookings_header': {
    en: 'Passenger Bookings',
    ta: 'பயணிகள் முன்பதிவுகள்'
  },
  'bookings.route_info': {
    en: 'Route {{routeNumber}} - {{routeName}}',
    ta: 'பாதை {{routeNumber}} - {{routeName}}'
  },
  'bookings.manage_all_passengers': {
    en: 'Manage and view all passenger bookings for your routes',
    ta: 'உங்கள் பாதைகளுக்கான அனைத்து பயணிகள் முன்பதிவுகளையும் நிர்வகித்து பார்க்கவும்'
  },
  'bookings.date_selection_header': {
    en: 'Date Selection',
    ta: 'தேதி தேர்வு'
  },
  'bookings.bookings_auto_update': {
    en: 'Bookings automatically update when date changes',
    ta: 'தேதி மாறும்போது முன்பதிவுகள் தானாகவே புதுப்பிக்கப்படும்'
  },
  'bookings.total_bookings_count': {
    en: 'Total Bookings',
    ta: 'மொத்த முன்பதிவுகள்'
  },
  'bookings.error_loading_bookings': {
    en: 'Error Loading Bookings',
    ta: 'முன்பதிவுகள் ஏற்றுவதில் பிழை'
  },
  'bookings.retry_button': {
    en: 'Retry',
    ta: 'மீண்டும் முயற்சிக்கவும்'
  },
  'bookings.loading_bookings': {
    en: 'Loading bookings...',
    ta: 'முன்பதிவுகள் ஏற்றப்படுகின்றன...'
  },
  'bookings.no_bookings_available': {
    en: 'No Bookings Found',
    ta: 'முன்பதிவுகள் எதுவும் கிடைக்கவில்லை'
  },
  'bookings.no_bookings_message': {
    en: 'No bookings available for the selected date. Try selecting a different date or check your route assignments.',
    ta: 'தேர்ந்தெடுக்கப்பட்ட தேதிக்கு முன்பதிவுகள் இல்லை. வேறு தேதியைத் தேர்ந்தெடுக்க முயற்சிக்கவும் அல்லது உங்கள் பாதை ஒதுக்கீடுகளைச் சரிபார்க்கவும்'
  },
  'bookings.booking_count': {
    en: '{{count}} booking',
    ta: '{{count}} முன்பதிவு'
  },
  'bookings.bookings_count_plural': {
    en: '{{count}} bookings',
    ta: '{{count}} முன்பதிவுகள்'
  },

  // Mobile Bottom Navigation
  'mobile_nav.home': {
    en: 'Home',
    ta: 'முகப்பு'
  },
  'mobile_nav.live': {
    en: 'Live',
    ta: 'நேரடி'
  },
  'mobile_nav.routes': {
    en: 'Routes',
    ta: 'பாதைகள்'
  },
  'mobile_nav.bookings': {
    en: 'Bookings',
    ta: 'முன்பதிவுகள்'
  },
  'mobile_nav.more': {
    en: 'More',
    ta: 'மேலும்'
  },

  // FAB Quick Actions
  'fab.quick_actions': {
    en: 'Quick Actions',
    ta: 'விரைவு செயல்கள்'
  },
  'fab.start_tracking': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கு'
  },
  'fab.share_location': {
    en: 'Share Location',
    ta: 'இருப்பிடத்தைப் பகிர்'
  },
  'fab.report_issue': {
    en: 'Report Issue',
    ta: 'சிக்கலைப் புகாரளி'
  },
  'fab.open_actions': {
    en: 'Open quick actions',
    ta: 'விரைவு செயல்களை திற'
  },
  'fab.close_actions': {
    en: 'Close quick actions',
    ta: 'விரைவு செயல்களை மூடு'
  },

  // More Menu
  'more_menu.driver_menu': {
    en: 'Driver Menu',
    ta: 'ஓட்டுநர் மெனு'
  },
  'more_menu.quick_navigation': {
    en: 'Quick navigation to all features',
    ta: 'அனைத்து அம்சங்களுக்கும் விரைவு வழிசெலுத்தல்'
  },
  'more_menu.dashboard': {
    en: 'Dashboard',
    ta: 'முகப்பு'
  },
  'more_menu.live_tracking': {
    en: 'Live Tracking',
    ta: 'நேரடி கண்காணிப்பு'
  },
  'more_menu.routes': {
    en: 'Routes',
    ta: 'பாதைகள்'
  },
  'more_menu.bookings': {
    en: 'Bookings',
    ta: 'முன்பதிவுகள்'
  },
  'more_menu.passengers': {
    en: 'Passengers',
    ta: 'பயணிகள்'
  },
  'more_menu.profile': {
    en: 'Profile',
    ta: 'சுயவிவரம்'
  },
  'more_menu.logout': {
    en: 'Logout',
    ta: 'வெளியேறு'
  },
  'more_menu.logout_description': {
    en: 'Sign out from your account',
    ta: 'உங்கள் கணக்கிலிருந்து வெளியேறு'
  },

  // Dashboard - Stats Cards
  'stats.active_routes': {
    en: 'Active Routes',
    ta: 'செயலில் உள்ள பாதைகள்'
  },
  'stats.passengers': {
    en: 'Passengers',
    ta: 'பயணிகள்'
  },
  'stats.total_routes': {
    en: 'Total Routes',
    ta: 'மொத்த பாதைகள்'
  },
  'stats.status': {
    en: 'Status',
    ta: 'நிலை'
  },
  'stats.active': {
    en: 'Active',
    ta: 'செயலில்'
  },

  // Quick Actions
  'quick_actions.title': {
    en: 'Quick Actions',
    ta: 'விரைவு செயல்கள்'
  },
  'quick_actions.my_routes': {
    en: 'My Routes',
    ta: 'எனது பாதைகள்'
  },
  'quick_actions.view_routes': {
    en: 'View all assigned routes',
    ta: 'அனைத்து ஒதுக்கப்பட்ட பாதைகளையும் பார்க்கவும்'
  },
  'quick_actions.bookings': {
    en: 'Bookings',
    ta: 'முன்பதிவுகள்'
  },
  'quick_actions.view_bookings': {
    en: 'View passenger bookings',
    ta: 'பயணிகள் முன்பதிவுகளைப் பார்க்கவும்'
  },

  // Routes Page
  'routes.no_routes': {
    en: 'No Routes Assigned',
    ta: 'பாதைகள் ஒதுக்கப்படவில்லை'
  },
  'routes.route': {
    en: 'Route',
    ta: 'பாதை'
  },
  'routes.loading_routes': {
    en: 'Loading routes...',
    ta: 'பாதைகள் ஏற்றப்படுகின்றன...'
  },
  'routes.view_bookings_button': {
    en: 'View Bookings',
    ta: 'முன்பதிவுகளைப் பார்க்கவும்'
  },
  'routes.route_details_button': {
    en: 'Route Details',
    ta: 'பாதை விவரங்கள்'
  },
  'routes.start_tracking_button': {
    en: 'Start Tracking',
    ta: 'கண்காணிப்பைத் தொடங்கவும்'
  },

  // Bookings Page - Date Selection
  'bookings.quick_select': {
    en: 'Quick select:',
    ta: 'விரைவு தேர்வு:'
  },
  'bookings.yesterday': {
    en: 'Yesterday',
    ta: 'நேற்று'
  },
  'bookings.today': {
    en: 'Today',
    ta: 'இன்று'
  },
  'bookings.tomorrow': {
    en: 'Tomorrow',
    ta: 'நாளை'
  },
  'bookings.date_selection': {
    en: 'Date Selection',
    ta: 'தேதி தேர்வு'
  },
  'bookings.total_bookings_label': {
    en: 'Total Bookings',
    ta: 'மொத்த முன்பதிவுகள்'
  },

  // Common Route Text
  'common.route': {
    en: 'Route',
    ta: 'பாதை'
  },

  // Additional Error Messages for Profile Page
  'error.user_email_not_found': {
    en: 'User email not found',
    ta: 'பயனர் மின்னஞ்சல் கிடைக்கவில்லை'
  },
  'error.failed_to_load_passengers': {
    en: 'Failed to load passengers',
    ta: 'பயணிகளை ஏற்ற முடியவில்லை'
  },
  'error.network_check_connection': {
    en: 'Network error. Please check your internet connection and refresh the page.',
    ta: 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து பக்கத்தைப் புதுப்பிக்கவும்.'
  },
  'error.request_timeout': {
    en: 'Request timed out. Please refresh the page and try again.',
    ta: 'கோரிக்கை நேரம் முடிந்தது. பக்கத்தைப் புதுப்பித்து மீண்டும் முயற்சிக்கவும்.'
  },
  'error.unauthorized_login_again': {
    en: 'Session expired. Please log in again.',
    ta: 'அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.'
  },
  'error.access_denied_contact_admin': {
    en: 'Access denied. Contact administrator for assistance.',
    ta: 'அணுகல் மறுக்கப்பட்டது. உதவிக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்.'
  },
  'error.profile_not_found_contact_support': {
    en: 'Driver profile not found. Please contact support.',
    ta: 'ஓட்டுநர் சுயவிவரம் கிடைக்கவில்லை. ஆதரவைத் தொடர்பு கொள்ளவும்.'
  },
  'error.server_error_try_later': {
    en: 'Server error. Please try again later or contact support.',
    ta: 'சர்வர் பிழை. பின்னர் மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.'
  },
  'error.validation_invalid_data': {
    en: 'Invalid data provided. Please check your input and try again.',
    ta: 'தவறான தரவு வழங்கப்பட்டது. உங்கள் உள்ளீட்டைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
  },
  'error.driver_not_found': {
    en: 'Driver ID not found',
    ta: 'ஓட்டுநர் ஐடி கிடைக்கவில்லை'
  },
  'error.failed_to_update_profile': {
    en: 'Failed to update profile',
    ta: 'சுயவிவரம் புதுப்பிக்க முடியவில்லை'
  },
  'error.failed_to_logout': {
    en: 'Failed to logout',
    ta: 'வெளியேற முடியவில்லை'
  },

  // Success Messages
  'success.profile_updated': {
    en: 'Profile updated successfully',
    ta: 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது'
  },
  'success.logged_out': {
    en: 'Logged out successfully',
    ta: 'வெற்றிகரமாக வெளியேறினீர்கள்'
  },

  // Live Tracking Error Messages
  'error.network_check_internet': {
    en: 'Network error. Please check your internet connection and refresh the page.',
    ta: 'நெட்வொர்க் பிழை. உங்கள் இணைய இணைப்பைச் சரிபார்த்து பக்கத்தைப் புதுப்பிக்கவும்.'
  },
  'error.request_timeout_refresh': {
    en: 'Request timed out. Please refresh the page and try again.',
    ta: 'கோரிக்கை நேரம் முடிந்தது. பக்கத்தைப் புதுப்பித்து மீண்டும் முயற்சிக்கவும்.'
  },
  'error.session_expired_login': {
    en: 'Session expired. Please log in again.',
    ta: 'அமர்வு காலாவதியானது. மீண்டும் உள்நுழையவும்.'
  },
  'error.forbidden_contact_admin': {
    en: 'Access denied. Contact administrator for assistance.',
    ta: 'அணுகல் மறுக்கப்பட்டது. உதவிக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்.'
  },
  'error.not_found_contact_support': {
    en: 'Driver profile not found. Please contact support.',
    ta: 'ஓட்டுநர் சுயவிவரம் கிடைக்கவில்லை. ஆதரவைத் தொடர்பு கொள்ளவும்.'
  },
  'error.server_contact_support': {
    en: 'Server error. Please try again later or contact support.',
    ta: 'சர்வர் பிழை. பின்னர் மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.'
  },
  'error.failed_to_load_driver_info': {
    en: 'Failed to load driver information',
    ta: 'ஓட்டுநர் தகவலை ஏற்ற முடியவில்லை'
  },

  // Passengers Page Additional Text
  'passengers.error': {
    en: 'Error',
    ta: 'பிழை'
  },
  'passengers.year': {
    en: 'Year',
    ta: 'ஆண்டு'
  },
  'passengers.route': {
    en: 'Route',
    ta: 'பாதை'
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
