import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/availability/checker';
import { query } from '@/lib/db/connection';
import { z } from 'zod';

const availabilitySchema = z.object({
  serviceId: z.string(),
  brandId: z.string(),
  employeeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, brandId, employeeId, startDate, endDate } = availabilitySchema.parse(body);

    // Get service details for duration
    const service = await query<any>(
      'SELECT calendar_id, duration FROM service_calendars WHERE id = ?',
      [serviceId]
    );

    if (!service || service.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get brand calendar ID
    const brand = await query<any>(
      'SELECT calendar_id FROM brand_calendars WHERE id = ?',
      [brandId]
    );

    if (!brand || brand.length === 0) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get employee primary calendar
    const employee = await query<any>(
      'SELECT primary_calendar_id FROM employees WHERE id = ?',
      [employeeId]
    );

    if (!employee || employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify employee is associated with this brand
    const association = await query<any>(
      'SELECT * FROM employee_brands WHERE employee_id = ? AND brand_calendar_id = ?',
      [employeeId, brandId]
    );

    if (!association || association.length === 0) {
      return NextResponse.json(
        { error: 'Employee is not associated with this brand' },
        { status: 400 }
      );
    }

    // Get available slots
    const slots = await getAvailableSlots(
      service[0].calendar_id,
      brand[0].calendar_id,
      employee[0].primary_calendar_id,
      new Date(startDate),
      new Date(endDate),
      service[0].duration
    );

    return NextResponse.json({
      slots: slots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    );
  }
}
