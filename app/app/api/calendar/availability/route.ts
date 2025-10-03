import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/calendar/availability';
import { getBrandById, getEmployeeById, getServiceById, getEmployeesForBrand } from '@/lib/config/settings';
import { z } from 'zod';

const availabilitySchema = z.object({
  brandId: z.string(),
  serviceId: z.string(),
  employeeId: z.string().optional(), // Optional - if not provided, checks all employees for the brand
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, serviceId, employeeId, startDate, endDate } = availabilitySchema.parse(body);

    // Get configuration
    const brand = getBrandById(brandId);
    const service = getServiceById(brandId, serviceId);

    if (!brand || !service) {
      return NextResponse.json(
        { error: 'Invalid brand or service' },
        { status: 400 }
      );
    }

    // Determine which employees to check
    let employeeEmails: string[];

    if (employeeId) {
      // Check specific employee
      const employee = getEmployeeById(employeeId);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 400 }
        );
      }
      if (!employee.brands.includes(brandId)) {
        return NextResponse.json(
          { error: 'Employee does not work for this brand' },
          { status: 400 }
        );
      }
      employeeEmails = [employee.primaryCalendarId];
    } else {
      // Check all employees for this brand
      const employees = getEmployeesForBrand(brandId);
      if (employees.length === 0) {
        return NextResponse.json(
          { error: 'No employees found for this brand' },
          { status: 400 }
        );
      }
      employeeEmails = employees.map(emp => emp.primaryCalendarId);
    }

    // Get available slots from the calendar system
    const slots = await getAvailableSlots(
      brand.sharedMailbox,
      employeeEmails,
      new Date(startDate),
      new Date(endDate),
      service.duration,
      brand.availabilityPattern
    );

    return NextResponse.json({
      slots: slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        duration: slot.duration,
        isRecurring: slot.isRecurring,
        availableStaffEmails: slot.availableStaffEmails,
      })),
      total: slots.length,
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    );
  }
}