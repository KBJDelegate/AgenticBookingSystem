import { NextRequest, NextResponse } from 'next/server';
import { getBookingBusinesses, getBookingServices } from '@/lib/bookings/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (businessId) {
      // Get services for a specific business
      const businessServices = await getBookingServices(businessId);

      const services = businessServices
        .filter(service => !service.isHiddenFromCustomers)
        .map(service => ({
          id: service.id,
          name: service.displayName,
          description: service.description,
          duration: service.defaultDuration,
          price: service.defaultPrice,
          priceType: service.defaultPriceType,
          businessId: businessId,
          staffMemberIds: service.staffMemberIds
        }));

      return NextResponse.json({ services });
    } else {
      // Get services from all businesses
      const businesses = await getBookingBusinesses();
      const allServices = [];

      for (const business of businesses) {
        const businessServices = await getBookingServices(business.id);
        const mappedServices = businessServices
          .filter(service => !service.isHiddenFromCustomers)
          .map(service => ({
            id: service.id,
            name: service.displayName,
            description: service.description,
            duration: service.defaultDuration,
            price: service.defaultPrice,
            priceType: service.defaultPriceType,
            businessId: business.id,
            businessName: business.displayName,
            staffMemberIds: service.staffMemberIds
          }));

        allServices.push(...mappedServices);
      }

      return NextResponse.json({ services: allServices });
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
