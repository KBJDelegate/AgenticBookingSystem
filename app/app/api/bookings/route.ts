import { NextRequest, NextResponse } from 'next/server';
import {
  createBookingAppointment,
  getBookingAppointments,
  getBookingServices,
  getBookingStaffMembers
} from '@/lib/bookings/service';
import { z } from 'zod';

const bookingSchema = z.object({
  serviceId: z.string(),
  businessId: z.string(),
  staffMemberId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  optOutOfCustomerEmail: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Create appointment using MS Bookings API
    const appointment = await createBookingAppointment(data.businessId, {
      serviceId: data.serviceId,
      staffMemberIds: [data.staffMemberId],
      startDateTime: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      endDateTime: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      customerName: data.customerName,
      customerEmailAddress: data.customerEmail,
      customerPhone: data.customerPhone,
      optOutOfCustomerEmail: data.optOutOfCustomerEmail ?? false,
    });

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const email = searchParams.get('email');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Fetch appointments
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const appointments = await getBookingAppointments(businessId, start, end);

    // Filter by email if provided
    let filteredAppointments = appointments;
    if (email) {
      filteredAppointments = appointments.filter(
        apt => apt.customerEmailAddress?.toLowerCase() === email.toLowerCase()
      );
    }

    // Enrich with service and staff names
    const [services, staffMembers] = await Promise.all([
      getBookingServices(businessId),
      getBookingStaffMembers(businessId),
    ]);

    const bookings = filteredAppointments.map(apt => {
      const service = services.find(s => s.id === apt.serviceId);
      const staffMember = staffMembers.find(s =>
        apt.staffMemberIds?.includes(s.id)
      );

      return {
        id: apt.id,
        customerName: apt.customerName,
        customerEmail: apt.customerEmailAddress,
        customerPhone: apt.customerPhone,
        startTime: apt.startDateTime.dateTime,
        endTime: apt.endDateTime.dateTime,
        serviceId: apt.serviceId,
        serviceName: service?.displayName || 'Unknown Service',
        staffMemberId: staffMember?.id,
        staffMemberName: staffMember?.displayName || 'Unknown Staff',
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
