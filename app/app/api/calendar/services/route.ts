import { NextRequest, NextResponse } from 'next/server';
import { getBrandById, getServicesForBrand } from '@/lib/config/settings';

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

    const brand = getBrandById(brandId);
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    const services = getServicesForBrand(brandId);

    return NextResponse.json({
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        duration: service.duration,
        description: service.description,
      })),
      total: services.length,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}