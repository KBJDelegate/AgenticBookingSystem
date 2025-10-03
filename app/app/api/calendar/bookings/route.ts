import { NextRequest, NextResponse } from 'next/server';
import { createBooking, cancelBooking, getCustomerBookings } from '@/lib/calendar/booking';
import { getBrandById, getEmployeeById, getServiceById, getEmployeesForBrand } from '@/lib/config/settings';
import { isTimeSlotAvailable } from '@/lib/calendar/service';
import { z } from 'zod';

const createBookingSchema = z.object({
  brandId: z.string(),
  serviceId: z.string(),
  employeeId: z.string().optional(), // Optional - will auto-assign if not provided
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Get configuration
    const brand = getBrandById(data.brandId);
    const service = getServiceById(data.brandId, data.serviceId);

    if (!brand || !service) {
      return NextResponse.json(
        { error: 'Invalid brand or service' },
        { status: 400 }
      );
    }

    // Determine which employee to assign
    let assignedEmployee;
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (data.employeeId) {
      // Use specified employee
      assignedEmployee = getEmployeeById(data.employeeId);
      if (!assignedEmployee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 400 }
        );
      }
      if (!assignedEmployee.brands.includes(data.brandId)) {
        return NextResponse.json(
          { error: 'Employee does not work for this brand' },
          { status: 400 }
        );
      }

      // Verify employee is available
      const isAvailable = await isTimeSlotAvailable(
        assignedEmployee.primaryCalendarId,
        startTime,
        endTime
      );
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Selected employee is not available at this time' },
          { status: 409 }
        );
      }
    } else {
      // Auto-assign to an available employee
      const employees = getEmployeesForBrand(data.brandId);
      if (employees.length === 0) {
        return NextResponse.json(
          { error: 'No employees found for this brand' },
          { status: 400 }
        );
      }

      // Find first available employee
      for (const employee of employees) {
        const isAvailable = await isTimeSlotAvailable(
          employee.primaryCalendarId,
          startTime,
          endTime
        );
        if (isAvailable) {
          assignedEmployee = employee;
          console.log(`Auto-assigned booking to ${employee.name} (${employee.email})`);
          break;
        }
      }

      if (!assignedEmployee) {
        return NextResponse.json(
          { error: 'No staff members are available at this time' },
          { status: 409 }
        );
      }
    }

    // Create the booking
    const booking = await createBooking({
      sharedMailboxEmail: brand.sharedMailbox,
      staffEmail: assignedEmployee.primaryCalendarId,
      serviceName: service.name,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      startTime,
      endTime,
      notes: data.notes,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      details: {
        id: booking.id,
        serviceName: booking.serviceName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        assignedStaff: {
          id: assignedEmployee.id,
          name: assignedEmployee.name,
          email: assignedEmployee.email,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes('no longer available')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const customerEmail = searchParams.get('email');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId is required' },
        { status: 400 }
      );
    }

    const brand = getBrandById(brandId);
    if (!brand) {
      return NextResponse.json(
        { error: 'Invalid brand' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    // Get customer bookings
    const bookings = await getCustomerBookings(
      customerEmail,
      brand.sharedMailbox,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        serviceName: booking.serviceName,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      })),
      total: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('bookingId');
    const reason = searchParams.get('reason');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    await cancelBooking(bookingId, reason || undefined);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes('already cancelled')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}