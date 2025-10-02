import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/calendar/availability';
import { getBrandById, getEmployeeById, getServiceById } from '@/lib/config/settings';
import { z } from 'zod';

const availabilitySchema = z.object({
  brandId: z.string(),
  serviceId: z.string(),
  employeeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, serviceId, employeeId, startDate, endDate } = availabilitySchema.parse(body);

    // Get configuration
    const brand = getBrandById(brandId);
    const employee = getEmployeeById(employeeId);
    const service = getServiceById(brandId, serviceId);

    if (!brand || !employee || !service) {
      return NextResponse.json(
        { error: 'Invalid brand, employee, or service' },
        { status: 400 }
      );
    }

    // Check if employee works for this brand
    if (!employee.brands.includes(brandId)) {
      return NextResponse.json(
        { error: 'Employee does not work for this brand' },
        { status: 400 }
      );
    }

    // Get available slots from the calendar system
    const slots = await getAvailableSlots(
      brand.sharedMailbox,
      employee.primaryCalendarId,
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