import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesForBrand, getEmployeeById, getBrandById } from '@/lib/config/settings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      // Get specific employee
      const employee = getEmployeeById(employeeId);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: employee.id,
        name: employee.name,
        email: employee.email,
        primaryCalendarId: employee.primaryCalendarId,
        brands: employee.brands,
      });
    }

    if (brandId) {
      // Get employees for a specific brand
      const brand = getBrandById(brandId);
      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }

      const employees = getEmployeesForBrand(brandId);

      return NextResponse.json({
        employees: employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
        })),
        total: employees.length,
      });
    }

    return NextResponse.json(
      { error: 'brandId or employeeId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}