import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/availability/checker';
import { getBrandById, getEmployeeById } from '@/lib/config/settings';
import { getBookingServices, getBookingBusiness } from '@/lib/bookings/service';
import { z } from 'zod';
import { addMinutes } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

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

    // Fetch business hours from MS Bookings
    const bookingBusiness = await getBookingBusiness(brand.msBookingsBusinessId);
    const businessHours = bookingBusiness.businessHours || [];

    console.log('Checking availability across THREE calendars:');
    console.log(`  1. Service Calendar: ${brand.msBookingsBusinessId} (defines available time windows)`);
    console.log(`  2. Brand Calendar: ${brand.calendarId} (brand availability)`);
    console.log(`  3. Employee Calendar: ${employee.primaryCalendarId} (employee availability)`);
    console.log(`  Service Duration: ${durationMinutes} minutes`);
    console.log(`  Business Hours:`, JSON.stringify(businessHours, null, 2));

    // Helper function to parse time string like "10:00:00.0000000" to hours and minutes
    const parseTimeOfDay = (timeStr: string): { hours: number; minutes: number } => {
      const parts = timeStr.split(':');
      return {
        hours: parseInt(parts[0]),
        minutes: parseInt(parts[1])
      };
    };

    // Helper function to get day name from date
    const getDayName = (date: Date): string => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      return days[date.getDay()];
    };

    // Use Copenhagen timezone (handles CET/CEST automatically)
    const timezone = 'Europe/Copenhagen';

    // Generate time slots based on business hours and check availability for each
    const slots = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Convert to Copenhagen timezone to get the correct day
      const localDate = toZonedTime(currentDate, timezone);
      const dayName = getDayName(localDate);

      // Find business hours for this day of the week
      const dayBusinessHours = businessHours.find(bh => bh.day === dayName);

      if (dayBusinessHours && dayBusinessHours.timeSlots && dayBusinessHours.timeSlots.length > 0) {
        // Process each time slot for this day
        for (const timeSlot of dayBusinessHours.timeSlots) {
          const startTime = parseTimeOfDay(timeSlot.startTime);
          const endTime = parseTimeOfDay(timeSlot.endTime);

          // Create date in Copenhagen timezone
          const slotDate = new Date(localDate);
          slotDate.setHours(startTime.hours, startTime.minutes, 0, 0);

          const slotEndDate = new Date(localDate);
          slotEndDate.setHours(endTime.hours, endTime.minutes, 0, 0);

          // Convert to UTC for API calls
          let slotDateUTC = fromZonedTime(slotDate, timezone);
          const slotEndDateUTC = fromZonedTime(slotEndDate, timezone);

          // Generate appointment slots within this business hour window
          while (slotDateUTC < slotEndDateUTC) {
            const appointmentStart = new Date(slotDateUTC);
            const appointmentEnd = addMinutes(appointmentStart, durationMinutes);

            // Only create slot if it fits within the business hours window
            if (appointmentEnd <= slotEndDateUTC) {
              // Check availability across all three calendars:
              // 1. Service calendar - defines when this service can be booked
              // 2. Brand calendar - is the brand/department available?
              // 3. Employee calendar - is the staff member free?
              const isAvailable = await checkAvailability(
                brand.msBookingsBusinessId,  // Service calendar (MS Bookings business)
                brand.calendarId,  // Brand calendar
                employee.primaryCalendarId,  // Employee calendar
                appointmentStart,
                appointmentEnd
              );

              if (isAvailable) {
                slots.push({
                  start: appointmentStart.toISOString(),
                  end: appointmentEnd.toISOString(),
                });
              }
            }

            // Move to next slot (30-minute intervals)
            slotDateUTC = addMinutes(slotDateUTC, 30);
          }
        }
      }

      // Move to next day
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
