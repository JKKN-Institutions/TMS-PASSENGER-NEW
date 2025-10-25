'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import parentAuthService, {
  ParentAppUser,
  AuthSession
} from './parent-auth-service';
import { ParentAppIntegrationService } from './parent-app-integration';
import unifiedAuthService, { UnifiedUser } from './unified-auth-service';
import driverAuthService from './driver-auth-service';
import staffLoginService from './staff-login-service';
import { sessionManager } from '../session';
import { AutoLoginService } from './auto-login-service';
import { staffAuthService } from './staff-auth-service';

interface AuthContextType {
  user: UnifiedUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userType: 'passenger' | 'driver' | 'staff' | null;
  login: (redirectUrl?: string) => void;
  loginDriver: (email: string, password: string) => Promise<boolean>;
  loginDriverDirect: (email: string, password: string) => Promise<boolean>;
  loginDriverOAuth: (redirectUrl?: string) => void;
  logout: (redirectToParent?: boolean) => void;
  refreshSession: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  hasPermission: (permission: string) => Promise<boolean>;
  hasRole: (role: string) => Promise<boolean>;
  hasAnyRole: (roles: string[]) => Promise<boolean>;
  handleAuthCallback: (
    token: string,
    refreshToken?: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  autoValidate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAuthChange?: (user: UnifiedUser | null) => void;
  onSessionExpired?: () => void;
}

export function AuthProvider({
  children,
  autoValidate = true,
  autoRefresh = true,
  refreshInterval = 10 * 60 * 1000, // 10 minutes
  onAuthChange,
  onSessionExpired
}: AuthProviderProps) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'passenger' | 'driver' | 'staff' | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Auth initialization - checking unified auth state...');
        
        // First check for driver authentication data in localStorage
        if (typeof window !== 'undefined') {
          // Check for driver auth service data (the keys it actually uses)
          const driverUser = localStorage.getItem('tms_driver_user');
          const driverSession = localStorage.getItem('tms_driver_session');
          const driverData = localStorage.getItem('tms_driver_data');
          
          if (driverUser && driverSession) {
            try {
              const userData = JSON.parse(driverUser);
              const sessionData = JSON.parse(driverSession);
              const expiresAt = sessionData.expires_at;
              
              // Check if token is expired
              if (Date.now() < expiresAt) {
                console.log('✅ Driver authentication found in localStorage:', userData);
                
                // Set driver user in auth context
                const driverUserData: UnifiedUser = {
                  ...userData,
                  role: 'driver',
                  driver_id: userData.user_metadata?.driver_id || userData.id
                };
                
                setUser(driverUserData);
                setUserType('driver');
                setIsLoading(false);
                
                // CRITICAL: Also set cookies when loading from localStorage
                if (typeof window !== 'undefined') {
                  const maxAge = 24 * 60 * 60; // 24 hours
                  const isSecure = window.location.protocol === 'https:';
                  const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
                  
                  document.cookie = `tms_driver_user=${encodeURIComponent(driverUser)}; ${cookieOptions}`;
                  document.cookie = `tms_driver_token=${encodeURIComponent(sessionData.access_token || 'driver-direct-token')}; ${cookieOptions}`;
                  document.cookie = `tms_driver_session=${encodeURIComponent(driverSession)}; ${cookieOptions}`;
                  
                  console.log('✅ Driver cookies refreshed from localStorage auth');
                }
                
                return; // Skip unified auth check since we have valid driver auth
              } else {
                console.log('❌ Driver token expired, clearing localStorage');
                localStorage.removeItem('tms_driver_user');
                localStorage.removeItem('tms_driver_session');
                localStorage.removeItem('tms_driver_data');
              }
            } catch (error) {
              console.error('❌ Error parsing driver data from localStorage:', error);
              localStorage.removeItem('tms_driver_user');
              localStorage.removeItem('tms_driver_session');
              localStorage.removeItem('tms_driver_data');
            }
          }

          // Check for staff authentication data in localStorage
          const staffUser = localStorage.getItem('tms_staff_user');
          const staffSession = localStorage.getItem('tms_staff_session');

          if (staffUser && staffSession) {
            try {
              const userData = JSON.parse(staffUser);
              const sessionData = JSON.parse(staffSession);
              const expiresAt = sessionData.expires_at;

              // Check if token is expired
              if (Date.now() < expiresAt) {
                console.log('✅ Staff authentication found in localStorage:', userData);

                // Set staff user in auth context
                const staffUserData: UnifiedUser = {
                  ...userData,
                  role: 'staff',
                  staff_id: userData.user_metadata?.staff_id || userData.id
                };

                setUser(staffUserData);
                setUserType('staff');
                setIsLoading(false);

                // Set cookies when loading from localStorage
                if (typeof window !== 'undefined') {
                  const maxAge = 24 * 60 * 60; // 24 hours
                  const isSecure = window.location.protocol === 'https:';
                  const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

                  document.cookie = `tms_staff_token=${encodeURIComponent(sessionData.access_token || 'staff-direct-token')}; ${cookieOptions}`;

                  console.log('✅ Staff cookies refreshed from localStorage auth');
                }

                return; // Skip unified auth check since we have valid staff auth
              } else {
                console.log('❌ Staff token expired, clearing localStorage');
                localStorage.removeItem('tms_staff_user');
                localStorage.removeItem('tms_staff_session');
                localStorage.removeItem('tms_staff_data');
              }
            } catch (error) {
              console.error('❌ Error parsing staff data from localStorage:', error);
              localStorage.removeItem('tms_staff_user');
              localStorage.removeItem('tms_staff_session');
              localStorage.removeItem('tms_staff_data');
            }
          }
        }

        // Get current auth state from unified service
        const authState = await unifiedAuthService.attemptAutoLogin();

        // Normalize user type: treat 'student' as 'passenger' for consistency
        const normalizedUserType = (authState.userType === 'student')
          ? 'passenger'
          : authState.userType;
        
        console.log('🔄 Auth initialization result:', {
          isAuthenticated: authState.isAuthenticated,
          userType: normalizedUserType,
          userEmail: authState.user?.email
        });

        if (authState.isAuthenticated && authState.user) {
          // Check if user has staff/super_admin role from parent app data
          // This must be done BEFORE setting userType to avoid OAuth staff users being treated as passengers
          let finalUserType = normalizedUserType;

          if (normalizedUserType === 'passenger' && authState.user) {
            const user = authState.user as any;

            // Check for staff/super_admin role indicators from parent app
            const hasStaffRole =
              user.role === 'staff' ||
              user.role === 'super_admin' ||
              user.role === 'superadmin' ||
              user.role === 'transport_staff' ||
              user.role === 'admin' ||
              user.role === 'transport_admin' ||
              user.role === 'faculty' ||
              user.role === 'employee' ||
              user.role === 'transport_manager' ||
              user.is_staff === true ||
              user.is_super_admin === true ||
              (user.permissions && (
                user.permissions.transport_access ||
                user.permissions.admin_access ||
                user.permissions.staff_access
              )) ||
              (typeof user.role === 'string' && (
                user.role.toLowerCase().includes('staff') ||
                user.role.toLowerCase().includes('admin') ||
                user.role.toLowerCase().includes('super') ||
                user.role.toLowerCase().includes('faculty') ||
                user.role.toLowerCase().includes('teacher') ||
                user.role.toLowerCase().includes('manager')
              ));

            if (hasStaffRole) {
              console.log('✅ User has staff/admin role from parent app, treating as staff:', {
                role: user.role,
                is_super_admin: user.is_super_admin,
                is_staff: user.is_staff
              });
              finalUserType = 'staff';

              // Store staff authentication data for staff layout/pages
              const staffUser = {
                id: user.id,
                email: user.email,
                staff_name: user.full_name || user.email?.split('@')[0] || 'Staff Member',
                department: user.department || 'Transport Management',
                role: 'staff' as const
              };

              const staffSession = {
                access_token: parentAuthService.getAccessToken() || '',
                refresh_token: parentAuthService.getRefreshToken() || '',
                expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
              };

              localStorage.setItem('tms_staff_user', JSON.stringify(staffUser));
              localStorage.setItem('tms_staff_session', JSON.stringify(staffSession));

              // Set cookies for server-side access
              document.cookie = `tms_staff_token=${staffSession.access_token}; path=/; max-age=${24 * 3600}`;
              document.cookie = `tms_staff_refresh=${staffSession.refresh_token}; path=/; max-age=${30 * 24 * 3600}`;

              console.log('✅ Staff authentication data stored in localStorage and cookies');
            }
          }

          setUser(authState.user);
          setSession(authState.session as AuthSession);
          setUserType(finalUserType);

          // For passenger users, enhance with local database data
          if (finalUserType === 'passenger' && authState.user && authState.user.email) {
            // Check if user already has studentId (already enhanced)
            const hasStudentId = 'studentId' in authState.user && authState.user.studentId;
            
            if (!hasStudentId) {
              console.log('🔧 Passenger user needs database enhancement, fetching local student record...');
              try {
                const integrationResult = await ParentAppIntegrationService.findOrCreateStudentFromParentApp(authState.user as ParentAppUser);
                
                if (integrationResult && integrationResult.student) {
                  const { student, isNewStudent } = integrationResult;
                  console.log('✅ Enhanced user object during initialization:', {
                    studentId: student.id,
                    email: student.email,
                    rollNumber: student.roll_number,
                    isNewStudent
                  });

                  const enhancedUser = {
                    ...authState.user,
                    studentId: student.id,
                    rollNumber: student.roll_number,
                    isNewStudent,
                    departmentId: student.department_id,
                    programId: student.program_id,
                    profileCompletionPercentage: student.profile_completion_percentage,
                    transportEnrolled: student.transport_enrolled,
                    enrollmentStatus: student.enrollment_status
                  } as ParentAppUser;

                  // Store the enhanced user in localStorage and parent auth service
                  parentAuthService.updateUser(enhancedUser);
                  setUser(enhancedUser);
                  
                  // Also store in sessionManager format for compatibility
                  if (authState.session) {
                    const sessionData = {
                      user: {
                        id: enhancedUser.id,
                        email: enhancedUser.email,
                        user_metadata: {
                          student_id: enhancedUser.studentId,
                          student_name: enhancedUser.full_name,
                          roll_number: enhancedUser.rollNumber
                        }
                      },
                      session: {
                        access_token: parentAuthService.getAccessToken() || '',
                        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                        refresh_token: parentAuthService.getRefreshToken() || ''
                      }
                    };
                    sessionManager.setSession(sessionData as any);
                    console.log('✅ Session stored in sessionManager during initialization for student:', enhancedUser.studentId);
                  }
                } else {
                  console.warn('⚠️ Could not fetch student record, user will have limited functionality');
                }
              } catch (error) {
                console.warn('⚠️ Error enhancing user object:', error);
              }
            } else {
              console.log('✅ User already enhanced with studentId:', (authState.user as any).studentId);
            }
          }

            // For staff users, ensure they have appropriate permissions
            if (normalizedUserType === 'staff' && authState.user) {
              console.log('✅ Staff user authenticated:', {
                email: authState.user.email,
                role: authState.user.role,
                permissions: authState.user.permissions
              });
            }

            // Check if passenger user is actually a staff member
            if (normalizedUserType === 'passenger' && authState.user) {
              try {
                console.log('🔍 Checking if passenger user is actually staff...');
                const enhancedUser = await staffAuthService.enhanceUserWithStaffData(authState.user);
                
                if (enhancedUser.role === 'staff') {
                  console.log('✅ User upgraded to staff role:', {
                    email: enhancedUser.email,
                    role: enhancedUser.role,
                    staffId: enhancedUser.staff_id
                  });
                  
                  // Update the user and userType
                  setUser(enhancedUser);
                  setUserType('staff');
                  
                  // Store enhanced user in parent auth service
                  parentAuthService.updateUser(enhancedUser);
                }
              } catch (error) {
                console.warn('⚠️ Error checking staff status:', error);
                // Continue with passenger role if staff check fails
              }
            }

          // Additional validation if enabled
          if (autoValidate) {
            const isValid = await unifiedAuthService.validateSession();
            if (!isValid) {
              console.log('❌ Session validation failed, clearing auth state');
              setUser(null);
              setSession(null);
              setUserType(null);
            }
          }
        } else {
          console.log('❌ No authenticated user found');
          setUser(null);
          setSession(null);
          setUserType(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        
        // Handle specific error types gracefully
        let errorMessage = 'Failed to initialize authentication';
        
        if (err instanceof Error) {
          if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and refresh the page.';
          } else if (err.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please refresh the page and try again.';
          } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (err.message.includes('forbidden') || err.message.includes('403')) {
            errorMessage = 'Access denied. Contact administrator for assistance.';
          } else if (err.message.includes('server') || err.message.includes('500')) {
            errorMessage = 'Server error. Please try again later or contact support.';
          } else if (err.message.includes('supabase') || err.message.includes('database')) {
            errorMessage = 'Database connection error. Please try again later.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setUser(null);
        setSession(null);
        
        // Auto-clear error after 10 seconds
        setTimeout(() => setError(null), 10000);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [autoValidate]);

  // Auto-refresh token
  useEffect(() => {
    if (!autoRefresh || !user || !session) return;

    const refreshTimer = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh timer triggered');
        const refreshed = await parentAuthService.refreshToken();
        if (refreshed) {
          const freshUser = parentAuthService.getUser();
          const freshSession = parentAuthService.getSession();
          setUser(freshUser);
          setSession(freshSession);
          console.log('✅ Auto-refresh successful');
        } else {
          console.warn('⚠️ Auto-refresh failed - checking if session should be cleared');
          
          // Check if this is a network error vs authentication error
          // For network errors, we keep the session and retry later
          const currentUser = parentAuthService.getUser();
          if (!currentUser) {
            // Only clear session if the service itself cleared it (auth error)
            console.log('🔒 Session cleared by auth service - logging out');
            setUser(null);
            setSession(null);
            if (onSessionExpired) {
              onSessionExpired();
            }
          } else {
            console.log('🌐 Keeping session active despite refresh failure (likely network issue)');
          }
        }
      } catch (err: any) {
        console.error('❌ Auto-refresh error:', {
          message: err.message,
          code: err.code,
          isNetworkError: err.code === 'NETWORK_ERROR' || err.message === 'Network Error'
        });
        
        // Don't clear session for network errors
        if (!(err.code === 'NETWORK_ERROR' || err.message === 'Network Error')) {
          console.log('🔒 Non-network error in auto-refresh - clearing session');
          setUser(null);
          setSession(null);
          if (onSessionExpired) {
            onSessionExpired();
          }
        } else {
          console.log('🌐 Network error in auto-refresh - keeping session');
        }
      }
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, [autoRefresh, user, session, refreshInterval, onSessionExpired]);

  // Notify auth changes
  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(user);
    }
  }, [user, onAuthChange]);

  // Check auth callback params on mount
  useEffect(() => {
    const checkAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const refreshToken = params.get('refresh_token');

      // Skip if we're on the callback page (it will handle itself)
      if (window.location.pathname === '/auth/callback') {
        return;
      }

      if (token) {
        try {
          setIsLoading(true);
          const authUser = await parentAuthService.handleCallback(
            token,
            refreshToken || undefined
          );

          if (authUser) {
            setUser(authUser);
            const newSession = parentAuthService.getSession();
            setSession(newSession);

            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', url.toString());

            // Handle post-login redirect
            const redirectUrl = sessionStorage.getItem('post_login_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('post_login_redirect');
              window.location.href = redirectUrl;
              return;
            }
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          setError('Authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthCallback();
  }, []);

  const login = (redirectUrl?: string) => {
    unifiedAuthService.loginPassenger(redirectUrl);
  };

  const loginDriverOAuth = (redirectUrl?: string) => {
    unifiedAuthService.loginDriverOAuth(redirectUrl);
  };

  const loginDriver = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await unifiedAuthService.loginDriver(email, password);
      
      if (result.success) {
        // Update state with driver user
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
        
        console.log('✅ Driver login successful:', result);
        return true;
      } else {
        setError(result.error || 'Driver login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Driver login failed';
      setError(errorMessage);
      console.error('❌ Driver login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDriverDirect = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await unifiedAuthService.loginDriverDirect(email, password);
      
      if (result.success) {
        // Instead of relying on getCurrentAuthState, explicitly set driver data
        console.log('✅ Driver direct login successful, setting driver state explicitly');
        
        // Try to get the stored driver data from localStorage
        const driverUser = localStorage.getItem('tms_driver_user');
        const driverSession = localStorage.getItem('tms_driver_session');
        
        if (driverUser && driverSession) {
          try {
            const userData = JSON.parse(driverUser);
            const sessionData = JSON.parse(driverSession);
            
            // Set driver user in auth context explicitly
            const driverUserData: UnifiedUser = {
              ...userData,
              role: 'driver',
              driver_id: userData.user_metadata?.driver_id || userData.id
            };
            
            setUser(driverUserData);
            setUserType('driver');
            setSession(sessionData as AuthSession);
            
            // CRITICAL: SET COOKIES for middleware validation
            if (typeof window !== 'undefined') {
              const maxAge = 24 * 60 * 60; // 24 hours
              const isSecure = window.location.protocol === 'https:';
              const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
              
              // Set cookies with proper encoding
              const userCookie = `tms_driver_user=${encodeURIComponent(driverUser)}; ${cookieOptions}`;
              const tokenCookie = `tms_driver_token=${encodeURIComponent(sessionData.access_token || 'driver-direct-token')}; ${cookieOptions}`;
              const sessionCookie = `tms_driver_session=${encodeURIComponent(JSON.stringify(sessionData))}; ${cookieOptions}`;
              
              document.cookie = userCookie;
              document.cookie = tokenCookie;
              document.cookie = sessionCookie;
              
              console.log('✅ Driver cookies set for middleware validation:', {
                userCookieLength: userCookie.length,
                tokenCookieLength: tokenCookie.length,
                sessionCookieLength: sessionCookie.length,
                cookieOptions,
                isSecure
              });
              
              // Verify cookies were set immediately
              const allCookies = document.cookie;
              const hasDriverUser = allCookies.includes('tms_driver_user=');
              const hasDriverToken = allCookies.includes('tms_driver_token=');
              const hasDriverSession = allCookies.includes('tms_driver_session=');
              
              console.log('🔍 Immediate cookie verification:', {
                hasDriverUser,
                hasDriverToken, 
                hasDriverSession,
                totalCookieLength: allCookies.length
              });
              
              // Additional verification after a delay
              setTimeout(() => {
                const cookies = document.cookie.split(';').map(c => c.trim());
                const driverCookies = cookies.filter(c => c.startsWith('tms_driver_'));
                console.log('🔍 Delayed verification - Driver cookies in browser:', {
                  count: driverCookies.length,
                  names: driverCookies.map(c => c.split('=')[0])
                });
              }, 100);
            }
            
            console.log('✅ Driver state set successfully:', {
              userType: 'driver',
              userId: userData.id,
              email: userData.email
            });
            
            return true;
          } catch (error) {
            console.error('❌ Error parsing stored driver data:', error);
          }
        }
        
        // Fallback: try to get auth state from unified service
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType('driver'); // Force set to driver
        
        console.log('✅ Driver direct login successful (fallback):', result);
        return true;
      } else {
        setError(result.error || 'Driver direct login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Driver direct login failed';
      setError(errorMessage);
      console.error('❌ Driver direct login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (redirectToParent: boolean = false) => {
    console.log('🔍 Logout initiated, userType:', userType, 'redirectToParent:', redirectToParent);

    try {
      // Use unified auth service to handle logout based on user type
      unifiedAuthService.logout(redirectToParent);

      // Clear local state
      setUser(null);
      setSession(null);
      setUserType(null);
      setError(null);

      // Reset auto-login state to prevent automatic re-login
      try {
        AutoLoginService.getInstance().resetAutoLoginState();
      } catch (error) {
        console.warn('Could not reset auto-login state:', error);
      }

      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear local state even if logout fails
      setUser(null);
      setSession(null);
      setUserType(null);
      setError(null);
    }

    // Redirect appropriately
    if (redirectToParent) {
      window.location.href =
        process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in';
    } else {
      window.location.href = '/login';
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const success = await unifiedAuthService.refreshSession();
      if (success) {
        // Update state with fresh data
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
      } else {
        // Clear state if refresh failed
        setUser(null);
        setSession(null);
        setUserType(null);
      }
      return success;
    } catch (err) {
      console.error('Refresh session error:', err);
      setUser(null);
      setSession(null);
      setUserType(null);
      return false;
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const isValid = await unifiedAuthService.validateSession();
      if (isValid) {
        // Update state with fresh data
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
      } else {
        setUser(null);
        setSession(null);
        setUserType(null);
      }
      return isValid;
    } catch (err) {
      console.error('Validate session error:', err);
      setUser(null);
      setSession(null);
      setUserType(null);
      return false;
    }
  };

  const handleAuthCallback = async (
    token: string,
    refreshToken?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Import debug service and log callback received
      const { oauthDebugService } = await import('@/lib/auth/oauth-debug-service');
      oauthDebugService.logStep(6, 'Callback Received', 'completed', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });

      oauthDebugService.logStep(7, 'Token Exchange', 'in-progress');

      // Check if this is a driver OAuth attempt
      const isDriverOAuth = typeof window !== 'undefined' && 
        sessionStorage.getItem('tms_oauth_role') === 'driver';
      
      console.log('🔐 [AUTH CONTEXT] Step 17: Processing authentication callback');
      console.log('🔐 [AUTH CONTEXT] Callback details:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        isDriverOAuth,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });

      console.log('🔐 [AUTH CONTEXT] Step 18: Calling parent auth service handleCallback');
      const authUser = await parentAuthService.handleCallback(
        token,
        refreshToken
      );
      
      console.log('🔐 [AUTH CONTEXT] Step 19: Parent auth service response received');
      console.log('🔐 [AUTH CONTEXT] Auth user details:', {
        hasUser: !!authUser,
        userEmail: authUser?.email,
        userRole: authUser?.role,
        userFullName: authUser?.full_name
      });

      if (!authUser) {
        oauthDebugService.logStep(7, 'Token Exchange', 'failed', null, 'Failed to get user data from parent app');
        oauthDebugService.endSession('failure', 'Token exchange failed - no user returned');
        return false;
      }

      oauthDebugService.logStep(7, 'Token Exchange', 'completed');
      oauthDebugService.logStep(8, 'User Data Retrieved', 'completed', {
        userEmail: authUser.email,
        userRole: authUser.role,
        userFullName: authUser.full_name,
        userPermissions: authUser.permissions
      });

      oauthDebugService.logStep(9, 'Role Validation', 'in-progress', {
        isDriverOAuth,
        userRole: authUser.role
      });

      if (authUser && isDriverOAuth) {
        console.log('🔐 [AUTH CONTEXT] Step 20: Processing driver OAuth validation');
        // Enhanced role debugging for driver OAuth
        console.log('🔐 [AUTH CONTEXT] Driver OAuth - Detailed user info from parent app:', {
          email: authUser.email,
          role: authUser.role,
          fullName: authUser.full_name,
          permissions: authUser.permissions,
          allUserData: authUser
        });

        // Check if user exists in local drivers table
        let hasDriverRole = false;
        let localDriverData = null;
        
        try {
          console.log('🔍 [AUTH CONTEXT] Checking local drivers table for:', authUser.email);
          const driverCheckResponse = await fetch(`/api/check-driver?email=${encodeURIComponent(authUser.email)}`);
          if (driverCheckResponse.ok) {
            const driverCheckData = await driverCheckResponse.json();
            hasDriverRole = driverCheckData.isDriver && driverCheckData.isActive;
            localDriverData = driverCheckData.driver;
            
            console.log('✅ [AUTH CONTEXT] Local driver check result:', {
              isDriver: driverCheckData.isDriver,
              isActive: driverCheckData.isActive,
              hasDriverRole,
              driverName: localDriverData?.name
            });
          }
        } catch (error) {
          console.warn('⚠️ [AUTH CONTEXT] Failed to check local drivers table:', error);
        }
        
        // If not found in local drivers table, check parent app role
        if (!hasDriverRole) {
          hasDriverRole = 
            authUser.role === 'driver' || 
            authUser.role === 'transport_staff' ||
            authUser.role === 'staff' ||
            authUser.role === 'employee' ||
            authUser.role === 'transport_employee' ||
            authUser.role === 'transport' ||
            authUser.role === 'admin' ||
            authUser.role === 'faculty' ||
            authUser.role === 'teacher' ||
            (authUser.permissions && authUser.permissions.transport_access) ||
            (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('driver')) ||
            (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('transport')) ||
            (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('admin')) ||
            (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('faculty'));
          
          console.log('🔍 [AUTH CONTEXT] Parent app role check result:', {
            hasDriverRole,
            role: authUser.role
          });
        }

        if (!hasDriverRole) {
          console.error('❌ User does not have driver role - showing all details for debugging:', {
            email: authUser.email,
            role: authUser.role,
            roleType: typeof authUser.role,
            checkedLocalDriversTable: true,
            localDriverFound: !!localDriverData,
            checkedRoles: ['driver', 'transport_staff', 'staff', 'employee', 'transport_employee', 'transport', 'admin', 'faculty', 'teacher'],
            permissions: authUser.permissions,
            fullUserData: JSON.stringify(authUser, null, 2)
          });
          
          oauthDebugService.logStep(9, 'Role Validation', 'failed', {
            userRole: authUser.role,
            checkedLocalDriversTable: true,
            localDriverFound: !!localDriverData,
            checkedRoles: ['driver', 'transport_staff', 'staff', 'employee', 'transport_employee', 'transport', 'admin', 'faculty', 'teacher'],
            permissions: authUser.permissions
          }, `User role "${authUser.role}" does not have driver privileges and was not found in local drivers table`);
          
          oauthDebugService.endSession('failure', `Access denied: User not authorized for driver access`);
          setError(`Access denied: Only registered drivers can access the driver dashboard. Contact admin if you should have driver access.`);
          return false;
        }

        console.log('✅ Driver role validated for OAuth user:', {
          email: authUser.email,
          role: authUser.role,
          validatedViaLocalDatabase: !!localDriverData
        });

        oauthDebugService.logStep(9, 'Role Validation', 'completed', {
          userRole: authUser.role,
          hasDriverRole: true,
          validatedViaLocalDatabase: !!localDriverData
        });

        oauthDebugService.logStep(10, 'Session Created', 'in-progress', {
          userType: 'driver',
          userEmail: authUser.email
        });

        // Create driver session for OAuth user using local driver data if available
        const driverId = localDriverData?.id || authUser.id;
        const driverName = localDriverData?.name || authUser.full_name || 'Driver';
        const driverPhone = localDriverData?.phone || authUser.phone_number;
        
        const driverAuthData = {
          user: {
            id: driverId,
            email: authUser.email,
            driver_name: driverName,
            phone: driverPhone,
            rating: 0,
            role: 'driver' as const,
            assigned_route_id: localDriverData?.assigned_route_id
          },
          driver: {
            id: driverId,
            name: driverName,
            email: authUser.email,
            phone: driverPhone,
            rating: 0,
            assigned_route_id: localDriverData?.assigned_route_id
          },
          session: {
            access_token: token,
            refresh_token: refreshToken || '',
            expires_at: Date.now() + (24 * 60 * 60 * 1000)
          }
        };

        console.log('💾 [AUTH CONTEXT] Creating driver session with data:', {
          driverId,
          driverName,
          email: authUser.email,
          usedLocalData: !!localDriverData
        });

        // Store driver auth data
        driverAuthService.storeAuthData(driverAuthData);
        
        // Update context state with DriverUser type
        setUser(driverAuthData.user);
        setUserType('driver');
        setSession(driverAuthData.session as any); // Cast to compatible session type

        oauthDebugService.logStep(10, 'Session Created', 'completed', {
          userType: 'driver',
          userEmail: authUser.email,
          userId: authUser.id,
          sessionStored: true
        });

        oauthDebugService.logStep(11, 'Redirect Complete', 'completed');
        oauthDebugService.endSession('success', 'Driver OAuth login completed successfully');

        return true;
      }
      if (authUser) {
        // Integrate with database - find or create student record
        try {
          console.log('🔗 Integrating parent app user with database:', authUser.email);
          console.log('🔗 Parent app user object:', authUser);
          const integrationResult = await ParentAppIntegrationService.findOrCreateStudentFromParentApp(authUser);
          
          if (integrationResult && integrationResult.student) {
            const { student, isNewStudent } = integrationResult;
            console.log(`${isNewStudent ? '🆕 Created new' : '✅ Found existing'} student record:`, {
              studentId: student.id,
              email: student.email,
              rollNumber: student.roll_number
            });

            // Update the user object with student information
            const enhancedUser = {
              ...authUser,
              studentId: student.id,
              rollNumber: student.roll_number,
              isNewStudent,
              // Add additional student info
              departmentId: student.department_id,
              programId: student.program_id,
              profileCompletionPercentage: student.profile_completion_percentage
            };

            console.log('🔧 Setting enhanced user in auth context:', {
              id: enhancedUser.id,
              email: enhancedUser.email,
              studentId: enhancedUser.studentId,
              rollNumber: enhancedUser.rollNumber,
              isNewStudent: enhancedUser.isNewStudent
            });
            
            // Store the enhanced user object in the parent auth service
            parentAuthService.updateUser(enhancedUser);
            setUser(enhancedUser);
            
            // Also store in sessionManager format for compatibility
            const session = parentAuthService.getSession();
            if (session) {
              const sessionData = {
                user: {
                  id: enhancedUser.id,
                  email: enhancedUser.email,
                  user_metadata: {
                    student_id: enhancedUser.studentId,
                    student_name: enhancedUser.full_name,
                    roll_number: enhancedUser.rollNumber
                  }
                },
                session: {
                  access_token: parentAuthService.getAccessToken() || '',
                  expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                  refresh_token: parentAuthService.getRefreshToken() || ''
                }
              };
              sessionManager.setSession(sessionData);
              console.log('✅ Session stored in sessionManager for student:', enhancedUser.studentId);
            }
          } else {
            console.warn('⚠️ Database integration returned no result, using fallback');
            // Create a fallback enhanced user with mock student data
            const fallbackUser = {
              ...authUser,
              studentId: authUser.id, // Use original ID as fallback
              rollNumber: `PA${authUser.id.substring(0, 8).toUpperCase()}`,
              isNewStudent: true,
              profileCompletionPercentage: 60
            };
            console.log('🔧 Setting fallback user in auth context:', {
              id: fallbackUser.id,
              email: fallbackUser.email,
              studentId: fallbackUser.studentId,
              rollNumber: fallbackUser.rollNumber,
              isNewStudent: fallbackUser.isNewStudent
            });
            
            // Store the fallback enhanced user object
            parentAuthService.updateUser(fallbackUser);
            setUser(fallbackUser);
          }
        } catch (dbError) {
          console.warn('⚠️ Database integration failed, creating fallback user:', dbError);
          // Create a fallback enhanced user with mock student data
          const fallbackUser = {
            ...authUser,
            studentId: authUser.id, // Use original ID as fallback
            rollNumber: `PA${authUser.id.substring(0, 8).toUpperCase()}`,
            isNewStudent: true,
            profileCompletionPercentage: 60
          };
          
          console.log('🔧 Setting fallback user in auth context (catch block):', {
            id: fallbackUser.id,
            email: fallbackUser.email,
            studentId: fallbackUser.studentId,
            rollNumber: fallbackUser.rollNumber,
            isNewStudent: fallbackUser.isNewStudent
          });
          
          // Store the fallback enhanced user object
          parentAuthService.updateUser(fallbackUser);
          setUser(fallbackUser);
        }

        const newSession = parentAuthService.getSession();
        setSession(newSession);
        setUserType('passenger'); // Ensure passenger user type is set
        return true;
      }
      return false;
    } catch (err) {
      console.error('Handle auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = async (permission: string): Promise<boolean> => {
    return await unifiedAuthService.hasPermission(permission);
  };

  const hasRole = async (role: string): Promise<boolean> => {
    return await unifiedAuthService.hasRole(role);
  };

  const hasAnyRole = async (roles: string[]): Promise<boolean> => {
    return await unifiedAuthService.hasAnyRole(roles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user && (userType === 'passenger' || userType === 'driver' || userType === 'staff'),
        error,
        userType,
        login,
        loginDriver,
        loginDriverDirect,
        loginDriverOAuth,
        logout,
        refreshSession,
        validateSession,
        hasPermission,
        hasRole,
        hasAnyRole,
        handleAuthCallback
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Additional hooks for convenience
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useCurrentUser(): UnifiedUser | null {
  const { user } = useAuth();
  return user;
}

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRole(role: string): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

export function useAnyRole(roles: string[]): boolean {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
}

export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}

export function useAuthError(): string | null {
  const { error } = useAuth();
  return error;
}

export function useSession() {
  const { session, validateSession, refreshSession } = useAuth();
  return { session, validateSession, refreshSession };
}
