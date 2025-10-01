import { NextRequest, NextResponse } from 'next/server';
import { getGraphClient } from '@/lib/graph/client';
import { checkAvailability } from '@/lib/availability/checker';
import { getBrandById, getEmployeeById, findStaffMemberIdByEmail } from '@/lib/config/settings';
import { getBookingServices, createBookingAppointment } from '@/lib/bookings/service';
import { z } from 'zod';

const bookingSchema = z.object({
  brandId: z.string(),
  serviceId: z.string(),
  employeeId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    // Get configuration
    const brand = getBrandById(data.brandId);
    const employee = getEmployeeById(data.employeeId);

    if (!brand || !employee) {
      return NextResponse.json(
        { error: 'Invalid brand or employee' },
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

    // Get service details
    const services = await getBookingServices(brand.msBookingsBusinessId);
    const service = services.find(s => s.id === data.serviceId);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Final availability check across all three calendars
    const isAvailable = await checkAvailability(
      brand.msBookingsBusinessId,  // Service calendar
      brand.calendarId,  // Brand calendar
      employee.primaryCalendarId,  // Employee calendar
      startTime,
      endTime
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      );
    }

    // Find the MS Bookings staff member ID for this employee
    const employeeStaffMemberId = await findStaffMemberIdByEmail(
      brand.msBookingsBusinessId,
      employee.email
    );

    if (!employeeStaffMemberId) {
      console.error(`Could not find MS Bookings staff member for ${employee.email}`);
      return NextResponse.json(
        { error: 'Employee not found in MS Bookings system' },
        { status: 400 }
      );
    }

    console.log(`Found MS Bookings staff member ID: ${employeeStaffMemberId} for ${employee.name}`);

    // Find the MS Bookings staff member ID for the brand calendar
    const brandStaffMemberId = await findStaffMemberIdByEmail(
      brand.msBookingsBusinessId,
      brand.calendarId
    );

    if (brandStaffMemberId) {
      console.log(`Found MS Bookings staff member ID: ${brandStaffMemberId} for brand ${brand.name}`);
    } else {
      console.warn(`Brand calendar ${brand.calendarId} is not a staff member in MS Bookings - event will not appear in brand calendar automatically`);
    }

    const client = getGraphClient();

    // Build the staffMemberIds array - include both employee and brand calendar if available
    const staffMemberIds = [employeeStaffMemberId];
    if (brandStaffMemberId) {
      staffMemberIds.push(brandStaffMemberId);
      console.log(`✓ Including both employee and brand calendar as staff members`);
    }

    // Create the MS Bookings appointment with staffMemberIds
    const bookingAppointment = {
      serviceId: data.serviceId,
      staffMemberIds: staffMemberIds,
      startDateTime: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      endDateTime: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      customers: [
        {
          '@odata.type': '#microsoft.graph.bookingCustomerInformation',
          name: data.customerName,
          emailAddress: data.customerEmail,
          phone: data.customerPhone || '',
        }
      ],
      optOutOfCustomerEmail: false,
    };

    let msBookingsAppointment;
    try {
      msBookingsAppointment = await createBookingAppointment(
        brand.msBookingsBusinessId,
        bookingAppointment
      );
      console.log(`✓ Created MS Bookings appointment: ${msBookingsAppointment.id}`);
    } catch (error) {
      console.error('✗ Failed to create MS Bookings appointment:', error);
      return NextResponse.json(
        { error: 'Failed to create booking in MS Bookings system' },
        { status: 500 }
      );
    }

    // MS Bookings automatically creates events in staff member calendars,
    // so we only need to create an event in the brand calendar for visibility
    const event = {
      subject: `${service.displayName} - ${data.customerName}`,
      body: {
        contentType: 'HTML',
        content: `
          <p><strong>Service:</strong> ${service.displayName}</p>
          <p><strong>Brand:</strong> ${brand.name}</p>
          <p><strong>Assigned to:</strong> ${employee.name}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
        `,
      },
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        {
          emailAddress: {
            address: data.customerEmail,
            name: data.customerName,
          },
          type: 'required',
        },
      ],
    };

    // MS Bookings automatically creates events in all staff member calendars
    // Since we included both employee and brand calendar as staff members,
    // events will appear in both calendars automatically with perfect sync
    console.log('✓ MS Bookings will automatically create events in all staff member calendars');
    console.log('✓ Cancellations will automatically sync to all staff member calendars');

    return NextResponse.json({
      success: true,
      bookingId: msBookingsAppointment.id,
      staffMembers: staffMemberIds.length,
      message: brandStaffMemberId
        ? 'Booking created - events will appear in both employee and brand calendars'
        : 'Booking created in employee calendar only (brand calendar not configured as staff member)',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
