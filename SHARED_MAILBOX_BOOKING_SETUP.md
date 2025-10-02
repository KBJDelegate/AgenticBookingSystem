# Shared Mailbox Booking System Setup Guide

## Overview
The booking system has been updated to use shared mailbox calendars instead of Microsoft Bookings. This new system uses recurring meetings in shared mailboxes to represent available time slots for booking.

## Key Concepts

### Reversed Logic
- **Recurring meetings = Available slots**: Unlike traditional calendars where meetings mean "busy", recurring meetings in the shared mailbox with "Available" in the subject represent bookable time slots
- **Actual bookings**: When a customer books, a real calendar event is created during the available slot

## System Architecture

### 1. Calendar Structure
- **Shared Mailbox Calendar**: Contains recurring "Available" meetings that define bookable slots
- **Staff Personal Calendar**: Individual staff member's calendar checked for conflicts
- **Customer Booking**: Creates events in both calendars when booked

### 2. Configuration (`config/settings.json`)
```json
{
  "brands": [
    {
      "id": "brandId",
      "name": "Brand Name",
      "sharedMailbox": "shared@domain.com",
      "availabilityPattern": "Available",
      "services": [
        {
          "id": "serviceId",
          "name": "Service Name",
          "duration": 30,
          "description": "Service description"
        }
      ]
    }
  ],
  "employees": [
    {
      "id": "employeeId",
      "name": "Employee Name",
      "email": "employee@domain.com",
      "primaryCalendarId": "employee@domain.com",
      "brands": ["brandId"]
    }
  ]
}
```

## Setting Up Available Slots

### 1. Create Recurring Meetings in Shared Mailbox

In Outlook or Microsoft 365:

1. **Open the shared mailbox calendar**
2. **Create a new recurring meeting**:
   - Subject: "Available - [Service Name]" (must include "Available")
   - Show as: "Free" or "Tentative" (NOT "Busy")
   - Recurrence: Set your pattern (e.g., every weekday 9:00 AM - 5:00 PM)
   - No attendees needed

### Example Recurring Meeting Patterns

#### Daily Availability (9 AM - 5 PM, Mon-Fri)
- Subject: "Available - Consultation"
- Start: 9:00 AM
- End: 5:00 PM
- Recurrence: Weekly, Monday through Friday
- Show as: Free

#### Specific Time Slots (30-minute slots)
- Create multiple recurring meetings:
  - "Available - Morning Slot" (9:00 AM - 9:30 AM)
  - "Available - Morning Slot" (9:30 AM - 10:00 AM)
  - etc.

## How It Works

### Availability Detection
1. System searches for recurring meetings with "Available" in the subject
2. Checks if the slot is marked as "Free" or "Tentative"
3. Verifies no conflicting bookings exist
4. Checks staff personal calendar for conflicts
5. Returns available slots to the customer

### Booking Process
1. Customer selects a service and staff member
2. System shows available slots based on recurring meetings
3. Customer selects a time and enters their information
4. System creates calendar events in:
   - Shared mailbox calendar (marked as "Busy")
   - Staff personal calendar (marked as "Busy")
5. Customer receives confirmation email with calendar invite

## API Endpoints

### New Calendar-Based Endpoints

- `POST /api/calendar/availability` - Get available time slots
- `POST /api/calendar/bookings` - Create a new booking
- `GET /api/calendar/bookings` - Get customer bookings
- `DELETE /api/calendar/bookings` - Cancel a booking
- `GET /api/calendar/brands` - Get brand configurations
- `GET /api/calendar/services` - Get services for a brand
- `GET /api/calendar/employees` - Get employees for a brand

## Environment Variables

Ensure these are set in your `.env` file:
```
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-app-secret
```

## Required Microsoft Graph Permissions

Your Azure AD application needs:
- `Calendars.ReadWrite` - Read and write calendars
- `Mail.Send` - Send confirmation emails
- `User.Read.All` - Read user profiles

## Testing the System

1. **Create test recurring meetings** in your shared mailbox
2. **Access the booking page** at `http://localhost:3000/[brandId]`
3. **Select a service and employee**
4. **View available slots** - should match your recurring meetings
5. **Create a test booking**
6. **Verify events** appear in both calendars

## Troubleshooting

### No Available Slots Showing
- Check recurring meetings have "Available" in the subject
- Verify meetings are marked as "Free" or "Tentative"
- Ensure the shared mailbox email is correct in settings.json
- Check the availabilityPattern matches your meeting subjects

### Booking Fails
- Verify both calendars are accessible
- Check Microsoft Graph permissions
- Ensure staff email matches primaryCalendarId
- Review console logs for specific errors

### Calendar Events Not Syncing
- Confirm shared mailbox permissions
- Check if events are being created (use Graph Explorer)
- Verify calendar IDs are correct

## Advantages of This System

1. **No Microsoft Bookings dependency** - Works with standard Exchange calendars
2. **Flexible availability** - Easy to manage through Outlook
3. **Visual availability** - Staff can see available slots in their calendar
4. **Conflict prevention** - Checks both shared and personal calendars
5. **Standard calendar features** - Reminders, invites, etc. work normally

## Migration from MS Bookings

1. Export existing bookings if needed
2. Create recurring "Available" meetings in shared mailbox
3. Update settings.json with new configuration
4. Test with a few bookings before full deployment
5. Redirect users to new booking URLs