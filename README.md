# KF Insurance Booking System

## Overview
A modern web-based booking system that allows insurance customers to schedule meetings with representatives through an intuitive interface. The system uses shared mailbox calendars with recurring "Available" meetings to define bookable time slots, integrating with Microsoft 365 infrastructure for seamless calendar management.

## Key Features
- **Multi-brand Support**: Configure multiple insurance brands with different services and employees
- **Shared Mailbox Calendar Integration**: Uses recurring meetings to define availability
- **Smart Conflict Detection**: Checks both shared mailbox and staff personal calendars
- **Real-time Availability**: Displays bookable slots based on recurring meeting patterns
- **Automated Confirmation**: Sends calendar invites to customers and staff

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Customer Browser                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Next.js Full-Stack Application             │   │
│  │                                                      │   │
│  │  • Booking Form    • Calendar View                  │   │
│  │  • API Routes      • Server Components              │   │
│  └──────────────────────┬───────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ Internal API Routes
                         ▼
         ┌──────────────────────────────────┐
         │   Microsoft Graph API            │
         │                                  │
         │   • Calendar API (Shared Mailbox)│
         │   • Calendar API (Staff Personal)│
         │   • Mail API (Invites)           │
         └──────────────────────────────────┘
```

## How It Works

### Reversed Calendar Logic
Unlike traditional calendars:
- **Recurring meetings = Available slots**: Meetings with "Available" in the subject represent bookable time
- **Actual bookings**: When a customer books, a real event is created during the available slot

### Booking Flow
1. Customer opens booking form for a specific brand
2. Selects service and staff member
3. System shows available slots from recurring meetings
4. Customer selects time and enters information
5. System creates calendar events in:
   - Shared mailbox calendar (marked as "Busy")
   - Staff personal calendar (marked as "Busy")
6. Customer receives confirmation email with calendar invite

## Technical Stack

### Frontend & Backend
- **Next.js 15** - React framework with App Router (Server & Client Components)
- **TypeScript** - Type safety across the stack
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Infrastructure
- **Microsoft Graph SDK** - Official SDK for Microsoft 365 integration
- **Azure AD** - Identity and access management
- **Docker** - Containerization for easy deployment

## Project Structure
```
KFInsuranceBookingSystem/
├── app/                          # Next.js application
│   ├── app/                     # App Router directory
│   │   ├── api/calendar/       # Calendar API routes
│   │   ├── [brandId]/          # Brand-specific booking pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   ├── lib/                    # Utilities & services
│   │   ├── calendar/          # Calendar service logic
│   │   └── config/            # Configuration loader
│   ├── .env.local             # Environment variables
│   └── package.json
├── config/
│   └── settings.json          # Brand and employee configuration
├── SHARED_MAILBOX_BOOKING_SETUP.md  # Detailed setup guide
└── docker-compose.yml         # Container orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Azure AD tenant with admin access
- Microsoft 365 with Exchange Online
- Shared mailbox with calendar configured
- Docker (optional)

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
cd app
npm install
```

### Configuration

#### 1. Azure AD App Registration
Create an Azure AD app with these permissions:
- `Calendars.ReadWrite` - Read and write calendars
- `Mail.Send` - Send confirmation emails
- `User.Read.All` - Read user profiles

#### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure:
```
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-app-secret
```

#### 3. Configure Brands and Employees
Edit `config/settings.json`:
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

#### 4. Setup Shared Mailbox Calendars
Create recurring meetings in the shared mailbox calendar:
- Subject: "Available - [Service Name]"
- Show as: "Free" or "Tentative"
- Recurrence: Set your desired pattern (e.g., weekdays 9-5)

See `SHARED_MAILBOX_BOOKING_SETUP.md` for detailed instructions.

### Running the Application
```bash
# Start Next.js development server (from app/ directory)
cd app
npm run dev

# Or use Docker
docker-compose up
```

The application will be available at:
- http://localhost:3000 - Home page
- http://localhost:3000/[brandId] - Brand-specific booking page

## API Endpoints

### Calendar-Based Endpoints
- `POST /api/calendar/availability` - Get available time slots
- `POST /api/calendar/bookings` - Create a new booking
- `GET /api/calendar/bookings` - Get customer bookings (by email)
- `DELETE /api/calendar/bookings` - Cancel a booking
- `GET /api/calendar/brands` - Get brand configurations
- `GET /api/calendar/services` - Get services for a brand
- `GET /api/calendar/employees` - Get employees for a brand

## Documentation

- **SHARED_MAILBOX_BOOKING_SETUP.md** - Complete setup guide with step-by-step instructions
- **config/settings.json** - Brand and employee configuration reference

## Advantages

1. **No Microsoft Bookings Dependency** - Works with standard Exchange calendars
2. **Flexible Availability** - Easy to manage through Outlook
3. **Visual Availability** - Staff can see available slots in their calendar
4. **Conflict Prevention** - Checks both shared and personal calendars
5. **Multi-brand Support** - Single system for multiple brands
6. **Standard Calendar Features** - Reminders, invites, etc. work normally

## Troubleshooting

### No Available Slots Showing
- Check recurring meetings have "Available" in the subject
- Verify meetings are marked as "Free" or "Tentative"
- Ensure shared mailbox email is correct in settings.json

### Booking Fails
- Verify both calendars are accessible
- Check Microsoft Graph permissions
- Ensure staff email matches primaryCalendarId
- Review console logs for specific errors

## License

[Add your license here]
