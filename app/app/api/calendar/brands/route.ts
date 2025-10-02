import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getBrandById } from '@/lib/config/settings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');

    if (brandId) {
      // Get specific brand
      const brand = getBrandById(brandId);
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: brand.id,
        name: brand.name,
        domain: brand.domain,
        sharedMailbox: brand.sharedMailbox,
        availabilityPattern: brand.availabilityPattern,
        services: brand.services,
      });
    }

    // Get all brands
    const settings = getSettings();
    const brands = settings.brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      domain: brand.domain,
      sharedMailbox: brand.sharedMailbox,
      availabilityPattern: brand.availabilityPattern,
      servicesCount: brand.services.length,
    }));

    return NextResponse.json({
      brands,
      total: brands.length,
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}