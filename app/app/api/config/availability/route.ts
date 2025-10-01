import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/availability/checker';
import { getBrandById, getEmployeeById } from '@/lib/config/settings';
import { getBookingServices } from '@/lib/bookings/service';
import { z } from 'zod';
import { addMinutes } from 'date-fns';

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
    const data = availabilitySchema.parse(body);

    // Get configuration
    const brand = getBrandById(data.brandId);
    const employee = getEmployeeById(data.employeeId);

    if (!brand || !employee) {
      return NextResponse.json(
        { error: 'Invalid brand or employee ID' },
        { status: 400 }
      );
    }

    // Check if employee works for this brand
    if (!employee.brands.includes(data.brandId)) {
      return NextResponse.json(
        { error: 'Employee does not work for this brand' },
        { status: 400 }
      );
    }

    // Get service details from MS Bookings
    const services = await getBookingServices(brand.msBookingsBusinessId);
    const service = services.find(s => s.id === data.serviceId);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Parse duration from ISO 8601 format (e.g., "PT60M" or "PT1H")
    let durationMinutes = 60; // default
    if (service.defaultDuration) {
      const duration = service.defaultDuration;
      // Match patterns like PT60M, PT1H, PT1H30M
      const hoursMatch = duration.match(/(\d+)H/);
      const minutesMatch = duration.match(/(\d+)M/);

      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

      durationMinutes = (hours * 60) + minutes;
    }

    console.log('Checking availability across THREE calendars:');
    console.log(`  1. Service Calendar: ${brand.msBookingsBusinessId} (defines available time windows)`);
    console.log(`  2. Brand Calendar: ${brand.calendarId} (brand availability)`);
    console.log(`  3. Employee Calendar: ${employee.primaryCalendarId} (employee availability)`);
    console.log(`  Service Duration: ${durationMinutes} minutes`);

    // Generate time slots and check availability for each
    const slots = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Working hours: 9 AM to 5 PM
      currentDate.setHours(9, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(17, 0, 0, 0);

      while (currentDate < endOfDay) {
        const slotStart = new Date(currentDate);
        const slotEnd = addMinutes(slotStart, durationMinutes);

        if (slotEnd <= endOfDay) {
          // Check availability across all three calendars:
          // 1. Service calendar - defines when this service can be booked
          // 2. Brand calendar - is the brand/department available?
          // 3. Employee calendar - is the staff member free?
          const isAvailable = await checkAvailability(
            brand.msBookingsBusinessId,  // Service calendar (MS Bookings business)
            brand.calendarId,  // Brand calendar
            employee.primaryCalendarId,  // Employee calendar
            slotStart,
            slotEnd
          );

          if (isAvailable) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    console.log(`Found ${slots.length} available slots`);

    return NextResponse.json({ slots: slots.slice(0, 20) }); // Return first 20 slots
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
