export interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  staff_id: string;
  designation: string;
  department: string;
  category: string;
  institution: string;
  is_active: boolean;
  date_of_joining: string;
  profile_picture: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  blood_group: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  byDepartment: Record<string, number>;
  byCategory: Record<string, number>;
}

class StaffHelpers {
  private cache: {
    staff: StaffMember[] | null;
    stats: StaffStats | null;
    lastFetched: number | null;
  } = {
    staff: null,
    stats: null,
    lastFetched: null
  };

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.lastFetched) return false;
    return Date.now() - this.cache.lastFetched < this.CACHE_DURATION;
  }

  /**
   * Fetch all staff members from the API
   */
  async getAllStaff(): Promise<StaffMember[]> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.staff) {
        console.log('📋 Using cached staff data');
        return this.cache.staff;
      }

      console.log('🔍 Fetching fresh staff data from API...');
      
      // Get access token for authentication
      const accessToken = typeof window !== 'undefined' 
        ? localStorage.getItem('tms_access_token') 
        : null;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization if token is available
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch('/api/staff', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        // Don't throw error, just return empty array
        console.warn('⚠️ Staff API returned', response.status, '- staff check skipped');
        return [];
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      // Update cache
      this.cache.staff = data.staff;
      this.cache.lastFetched = Date.now();
      
      console.log('✅ Staff data fetched and cached:', {
        total: data.staff.length,
        timestamp: new Date().toLocaleTimeString()
      });

      return data.staff;

    } catch (error) {
      console.warn('⚠️ Staff data fetch failed (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      
      // Return cached data if available, even if expired
      if (this.cache.staff) {
        console.log('📋 Returning expired cached staff data due to fetch error');
        return this.cache.staff;
      }
      
      // Return empty array instead of throwing - staff check is optional
      return [];
    }
  }

  /**
   * Get staff statistics
   */
  async getStaffStats(): Promise<StaffStats> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.stats) {
        return this.cache.stats;
      }

      const staff = await this.getAllStaff();
      
      // Calculate statistics
      const stats: StaffStats = {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.is_active).length,
        inactiveStaff: staff.filter(s => !s.is_active).length,
        teachingStaff: staff.filter(s => s.category.toLowerCase().includes('teaching')).length,
        nonTeachingStaff: staff.filter(s => !s.category.toLowerCase().includes('teaching')).length,
        byDepartment: {},
        byCategory: {}
      };

      // Count by department
      staff.forEach(s => {
        const dept = s.department;
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });

      // Count by category
      staff.forEach(s => {
        const cat = s.category;
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      });

      // Update cache
      this.cache.stats = stats;
      
      return stats;

    } catch (error) {
      console.error('❌ Error calculating staff stats:', error);
      
      // Return cached stats if available
      if (this.cache.stats) {
        return this.cache.stats;
      }
      
      throw error;
    }
  }

  /**
   * Get staff member by email
   */
  async getStaffByEmail(email: string): Promise<StaffMember | null> {
    try {
      const staff = await this.getAllStaff();
      return staff.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('❌ Error finding staff by email:', error);
      return null;
    }
  }

  /**
   * Get staff member by ID
   */
  async getStaffById(id: string): Promise<StaffMember | null> {
    try {
      const staff = await this.getAllStaff();
      return staff.find(s => s.id === id) || null;
    } catch (error) {
      console.error('❌ Error finding staff by ID:', error);
      return null;
    }
  }

  /**
   * Search staff by name, email, or designation
   */
  async searchStaff(query: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      const lowerQuery = query.toLowerCase();
      
      return staff.filter(s => 
        s.full_name.toLowerCase().includes(lowerQuery) ||
        s.email.toLowerCase().includes(lowerQuery) ||
        s.designation.toLowerCase().includes(lowerQuery) ||
        s.department.toLowerCase().includes(lowerQuery) ||
        s.staff_id.includes(query)
      );
    } catch (error) {
      console.error('❌ Error searching staff:', error);
      return [];
    }
  }

  /**
   * Get staff by department
   */
  async getStaffByDepartment(department: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => 
        s.department.toLowerCase().includes(department.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error filtering staff by department:', error);
      return [];
    }
  }

  /**
   * Get staff by category
   */
  async getStaffByCategory(category: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => 
        s.category.toLowerCase().includes(category.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error filtering staff by category:', error);
      return [];
    }
  }

  /**
   * Get active staff only
   */
  async getActiveStaff(): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => s.is_active);
    } catch (error) {
      console.error('❌ Error filtering active staff:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.staff = null;
    this.cache.stats = null;
    this.cache.lastFetched = null;
    console.log('🗑️ Staff cache cleared');
  }

  /**
   * Force refresh data (ignores cache)
   */
  async forceRefresh(): Promise<StaffMember[]> {
    this.clearCache();
    return await this.getAllStaff();
  }

  /**
   * Get routes assigned to staff member
   */
  async getAssignedRoutes(staffId: string, email?: string) {
    const searchParams = new URLSearchParams();
    searchParams.set('staffId', staffId);
    if (email) {
      searchParams.set('email', email);
    }
    const res = await fetch(`/api/staff/routes?${searchParams.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.routes || [];
  }

  /**
   * Get bookings for a route and date, useful for stop-wise view
   */
  async getRouteBookings(params: { routeId?: string; routeNumber?: string; date?: string }) {
    const searchParams = new URLSearchParams();
    if (params.routeId) searchParams.set('routeId', params.routeId);
    if (params.routeNumber) searchParams.set('routeNumber', params.routeNumber);
    if (params.date) searchParams.set('date', params.date);
    const res = await fetch(`/api/staff/bookings?${searchParams.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.bookings || [];
  }

  /**
   * Scan a ticket and record attendance
   */
  async scanTicket(ticketCode: string, staffEmail: string, scanLocation?: string) {
    const res = await fetch('/api/staff/scan-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode, staffEmail, scanLocation })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to scan ticket');
    return json;
  }

  /**
   * Get attendance records for a route and date
   */
  async getAttendance(params: { routeId?: string; date?: string; staffEmail: string }) {
    const searchParams = new URLSearchParams();
    if (params.routeId) searchParams.set('routeId', params.routeId);
    if (params.date) searchParams.set('date', params.date);
    searchParams.set('staffEmail', params.staffEmail);

    const res = await fetch(`/api/staff/attendance?${searchParams.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json;
  }

  /**
   * Get attendance overview with booking details
   */
  async getAttendanceOverview(params: { routeId: string; date: string; staffEmail: string }) {
    const searchParams = new URLSearchParams();
    searchParams.set('routeId', params.routeId);
    searchParams.set('date', params.date);
    searchParams.set('staffEmail', params.staffEmail);

    const res = await fetch(`/api/staff/attendance-overview?${searchParams.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json;
  }

  /**
   * Mark a student's presence status (present/absent)
   */
  async markPresence(bookingId: string, status: 'present' | 'absent', staffEmail: string, notes?: string) {
    const res = await fetch('/api/staff/mark-presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status, staffEmail, notes })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to mark presence');
    return json;
  }

  /**
   * Bulk mark attendance
   */
  async bulkMarkAttendance(params: {
    action: 'mark_all_absent' | 'mark_selected_present' | 'mark_selected_absent';
    routeId: string;
    date: string;
    staffEmail: string;
    bookingIds?: string[];
  }) {
    const res = await fetch('/api/staff/bulk-mark-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to bulk mark attendance');
    return json;
  }
}

// Export singleton instance
export const staffHelpers = new StaffHelpers();

