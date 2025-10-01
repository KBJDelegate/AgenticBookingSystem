import { NextRequest, NextResponse } from 'next/server';
import { getBrandById } from '@/lib/config/settings';
import { getBookingServices } from '@/lib/bookings/service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId is required' },
        { status: 400 }
      );
    }

    // Get brand configuration
    const brand = getBrandById(brandId);
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Fetch services from the brand's MS Bookings business
    const msBookingsServices = await getBookingServices(brand.msBookingsBusinessId);

    // Map to our format
    const services = msBookingsServices
      .filter(s => !s.isHiddenFromCustomers)
      .map(s => ({
        id: s.id,
        name: s.displayName,
        description: s.description,
        duration: s.defaultDuration,
        price: s.defaultPrice,
        priceType: s.defaultPriceType,
      }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services from MS Bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
