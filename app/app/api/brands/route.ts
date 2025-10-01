import { NextRequest, NextResponse } from 'next/server';
import { getBookingBusinesses } from '@/lib/bookings/service';

export async function GET(request: NextRequest) {
  try {
    const businesses = await getBookingBusinesses();

    console.log('=== MS Bookings Businesses Debug ===');
    console.log(`Total businesses found: ${businesses.length}`);

    businesses.forEach((business, index) => {
      console.log(`\nBusiness ${index + 1}:`);
      console.log(`  ID: ${business.id}`);
      console.log(`  Display Name: ${business.displayName}`);
      console.log(`  Email: ${business.email || 'N/A'}`);
      console.log(`  Phone: ${business.phone || 'N/A'}`);
      console.log(`  Website: ${business.webSiteUrl || 'N/A'}`);
      if (business.address) {
        console.log(`  Address: ${JSON.stringify(business.address)}`);
      }
    });
    console.log('=== End Debug ===\n');

    // Map MS Bookings businesses to brands format
    const brands = businesses.map(business => ({
      id: business.id,
      name: business.displayName,
      email: business.email,
      phone: business.phone,
      address: business.address,
      webSiteUrl: business.webSiteUrl
    }));

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
