import settingsData from '@/config/settings.json';

export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  calendarId: string; // Brand's shared calendar
  msBookingsBusinessId: string; // MS Bookings business where services are defined
}

export interface EmployeeConfig {
  id: string;
  name: string;
  email: string;
  primaryCalendarId: string;
  brands: string[]; // Array of brand IDs this employee works for
  msBookingsStaffMemberId?: string; // MS Bookings staff member ID for appointment assignment
}

export interface Settings {
  brands: BrandConfig[];
  employees: EmployeeConfig[];
}

export function getSettings(): Settings {
  return settingsData as Settings;
}

export function getBrandById(brandId: string): BrandConfig | undefined {
  return settingsData.brands.find(b => b.id === brandId);
}

export function getEmployeeById(employeeId: string): EmployeeConfig | undefined {
  return settingsData.employees.find(e => e.id === employeeId);
}

export function getEmployeesForBrand(brandId: string): EmployeeConfig[] {
  return settingsData.employees.filter(emp => emp.brands.includes(brandId));
}

/**
 * Helper function to find MS Bookings staff member ID by matching email
 */
export async function findStaffMemberIdByEmail(
  msBookingsBusinessId: string,
  email: string
): Promise<string | null> {
  const { getBookingStaffMembers } = await import('@/lib/bookings/service');

  try {
    const staffMembers = await getBookingStaffMembers(msBookingsBusinessId);
    const matchedStaff = staffMembers.find(
      staff => staff.emailAddress?.toLowerCase() === email.toLowerCase()
    );

    return matchedStaff?.id || null;
  } catch (error) {
    console.error(`Error finding staff member by email ${email}:`, error);
    return null;
  }
}
