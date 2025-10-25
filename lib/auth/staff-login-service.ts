import Cookies from 'js-cookie';

export interface StaffUser {
  id: string;
  email: string;
  staff_name: string;
  department?: string;
  role: 'staff';
}

export interface StaffSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface StaffAuthData {
  user: StaffUser;
  staff: {
    id: string;
    name: string;
    email: string;
    department?: string;
    role?: string;
  };
  session: StaffSession;
}

class StaffLoginService {
  private storageKey = 'tms_staff_user';
  private sessionKey = 'tms_staff_session';
  private staffKey = 'tms_staff_data';

  /**
   * Direct login staff with email and password (with parent app integration)
   */
  async directLogin(email: string, password: string): Promise<StaffAuthData | null> {
    try {
      const response = await fetch('/api/auth/staff-direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
          api_key: process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Direct login failed');
      }

      const data = await response.json();

      // Transform response to match expected format
      const transformedData: StaffAuthData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          staff_name: data.user.user_metadata?.staff_name || data.user.full_name || 'Staff Member',
          department: data.user.user_metadata?.department || data.staff?.department,
          role: 'staff'
        },
        staff: data.staff,
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.session?.expires_at || Date.now() + (24 * 60 * 60 * 1000)
        }
      };

      // Store staff data
      this.storeAuthData(transformedData);

      return transformedData;
    } catch (error) {
      console.error('Staff direct login error:', error);
      throw error;
    }
  }

  /**
   * Store staff authentication data
   */
  storeAuthData(data: StaffAuthData): void {
    if (typeof window === 'undefined') return;

    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(data.user));
    localStorage.setItem(this.staffKey, JSON.stringify(data.staff));
    localStorage.setItem(this.sessionKey, JSON.stringify(data.session));

    // Store in cookies for server-side access
    document.cookie = `tms_staff_token=${data.session.access_token}; path=/; max-age=${24 * 3600}`;
    document.cookie = `tms_staff_refresh=${data.session.refresh_token}; path=/; max-age=${30 * 24 * 3600}`;
  }

  /**
   * Get stored staff user
   */
  getUser(): StaffUser | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = localStorage.getItem(this.storageKey);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored staff session
   */
  getSession(): StaffSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedSession = localStorage.getItem(this.sessionKey);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored staff data
   */
  getStaffData(): StaffAuthData['staff'] | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedStaff = localStorage.getItem(this.staffKey);
      return storedStaff ? JSON.parse(storedStaff) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return Cookies.get('tms_staff_token') || null;
  }

  /**
   * Check if staff is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getUser();
    const session = this.getSession();
    const token = this.getAccessToken();

    if (!user || !session || !token) {
      return false;
    }

    // Check if token is expired
    if (session.expires_at < Date.now()) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const session = this.getSession();
    const user = this.getUser();

    if (!session || !user) {
      return false;
    }

    // Check expiry
    if (session.expires_at < Date.now()) {
      this.logout();
      return false;
    }

    // For now, assume valid if not expired
    // In a real implementation, you might want to validate with the server
    return true;
  }

  /**
   * Refresh staff session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const session = this.getSession();

      if (!session?.refresh_token) {
        return false;
      }

      // For now, just extend the expiry
      // In a real implementation, you would call a refresh endpoint
      const newExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const updatedSession = {
        ...session,
        expires_at: newExpiry
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has specific role (staff always have 'staff' role)
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Logout staff
   */
  logout(): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.staffKey);

    // Clear cookies
    document.cookie = 'tms_staff_token=; path=/; max-age=0';
    document.cookie = 'tms_staff_refresh=; path=/; max-age=0';
  }

  /**
   * Update user data
   */
  updateUser(user: StaffUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }
}

// Export singleton instance
const staffLoginService = new StaffLoginService();
export default staffLoginService;
