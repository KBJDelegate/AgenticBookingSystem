import { NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graph/client';

export async function GET() {
  const client = getGraphClient();

  try {
    console.log('Fetching all MS Bookings businesses...');

    // Fetch all booking businesses
    const businessesResponse = await client
      .api('/solutions/bookingBusinesses')
      .get();

    const businesses = businessesResponse.value;
    console.log(`Found ${businesses.length} booking businesses`);

    const allBusinessesData = [];

    for (const business of businesses) {
      const businessData: any = {
        business: {
          id: business.id,
          displayName: business.displayName,
          email: business.email,
          phone: business.phone || 'N/A',
          address: business.address || null,
        },
        staff: [],
      };

      // Fetch staff members for this business
      try {
        const staffResponse = await client
          .api(`/solutions/bookingBusinesses/${business.id}/staffMembers`)
          .get();

        businessData.staff = staffResponse.value.map((member: any) => ({
          id: member.id,
          displayName: member.displayName,
          emailAddress: member.emailAddress,
          role: member.role || 'N/A',
        }));
      } catch (error: any) {
        console.error(`Error fetching staff for ${business.displayName}:`, error.message);
        businessData.error = `Failed to fetch staff: ${error.message}`;
      }

      allBusinessesData.push(businessData);
    }

    // Generate settings.json structure
    const settingsStructure = {
      brands: businesses.map((business: any) => ({
        id: business.displayName.toLowerCase().replace(/\s+/g, ''),
        name: business.displayName,
        domain: business.email?.split('@')[1] || 'example.com',
        calendarId: business.email || '',
        msBookingsBusinessId: business.id,
      })),
      employees: [] as any[],
    };

    // Consolidate all staff members
    const allStaff = new Map();

    for (const businessData of allBusinessesData) {
      const brandId = settingsStructure.brands.find(
        (b: any) => b.msBookingsBusinessId === businessData.business.id
      )?.id;

      for (const member of businessData.staff) {
        if (!allStaff.has(member.emailAddress)) {
          allStaff.set(member.emailAddress, {
            id: member.emailAddress.split('@')[0],
            name: member.displayName,
            email: member.emailAddress,
            primaryCalendarId: member.emailAddress,
            brands: [brandId],
          });
        } else {
          const existing = allStaff.get(member.emailAddress);
          if (brandId && !existing.brands.includes(brandId)) {
            existing.brands.push(brandId);
          }
        }
      }
    }

    settingsStructure.employees = Array.from(allStaff.values());

    return NextResponse.json({
      success: true,
      businessesCount: businesses.length,
      rawData: allBusinessesData,
      settingsStructure,
    });
  } catch (error: any) {
    console.error('Error fetching bookings data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bookings data',
        message: error.message,
        details: error.body,
      },
      { status: 500 }
    );
  }
}
