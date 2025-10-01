import { NextRequest, NextResponse } from 'next/server';
import { getSettings, getEmployeesForBrand } from '@/lib/config/settings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');

    if (brandId) {
      // Get employees for a specific brand
      const employees = getEmployeesForBrand(brandId);
      return NextResponse.json({ employees });
    } else {
      // Get all employees
      const settings = getSettings();
      return NextResponse.json({ employees: settings.employees });
    }
  } catch (error) {
    console.error('Error fetching employees from config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
