import { NextRequest, NextResponse } from 'next/server';
import { getBookingBusinesses, getBookingStaffMembers } from '@/lib/bookings/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (businessId) {
      // Get staff members for a specific business
      const staffMembers = await getBookingStaffMembers(businessId);

      const employees = staffMembers.map(staff => ({
        id: staff.id,
        name: staff.displayName,
        email: staff.emailAddress,
        role: staff.role,
        businessId: businessId,
        useBusinessHours: staff.useBusinessHours,
        availabilityIsAffectedByPersonalCalendar: staff.availabilityIsAffectedByPersonalCalendar
      }));

      return NextResponse.json({ employees });
    } else {
      // Get staff members from all businesses
      const businesses = await getBookingBusinesses();
      const allEmployees = [];

      for (const business of businesses) {
        const staffMembers = await getBookingStaffMembers(business.id);
        const mappedStaff = staffMembers.map(staff => ({
          id: staff.id,
          name: staff.displayName,
          email: staff.emailAddress,
          role: staff.role,
          businessId: business.id,
          businessName: business.displayName,
          useBusinessHours: staff.useBusinessHours,
          availabilityIsAffectedByPersonalCalendar: staff.availabilityIsAffectedByPersonalCalendar
        }));

        allEmployees.push(...mappedStaff);
      }

      return NextResponse.json({ employees: allEmployees });
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
