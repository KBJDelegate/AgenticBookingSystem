# KF Insurance Booking System v2.0

A complete redesign of the KF Insurance booking system built with Next.js 15, App Router, and shadcn/ui.

## Architecture

This system implements a **3-calendar availability checking** architecture:

### Calendar Types

1. **Service Calendars** (Tjeneste-kalendere)
   - Shared calendars for each service type
   - Examples: `onboarding@kunde.dk`, `support@kunde.dk`
   - Defines what services are available

2. **Brand/Department Calendars** (Afdeling/Brand-kalendere)
   - Shared calendars for departments/brands
   - Examples: `hr@kunde.dk`, `it@kunde.dk`, `torben@brand.dk`
   - Defines when departments are open

3. **Employee Primary Calendars** (Medarbejder primær-kalender)
   - Personal calendars for employees
   - Examples: `torben@kunde.dk`
   - Defines when individual employees are available

### Booking Logic

When a customer books a meeting, the system checks **all three calendars**:

```
✓ Service Calendar Available?  (e.g., onboarding@kunde.dk)
✓ Brand Calendar Available?    (e.g., hr@kunde.dk)
✓ Employee Calendar Available? (e.g., torben@kunde.dk)
```

Only if **all three are available**, the time slot is bookable.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: MySQL
- **Calendar Integration**: Microsoft Graph API
- **Authentication**: Azure AD (for Graph API)
- **Language**: TypeScript

## Project Structure

```
app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── availability/  # Check 3-calendar availability
│   │   ├── bookings/      # Create and manage bookings
│   │   ├── services/      # Service calendar management
│   │   ├── brands/        # Brand calendar management
│   │   └── employees/     # Employee management
│   ├── booking/           # Customer booking UI
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components (shadcn/ui)
├── lib/
│   ├── db/               # Database connection and schema
│   ├── graph/            # Microsoft Graph client
│   ├── availability/     # Availability checking logic
│   └── types.ts          # TypeScript types
└── public/               # Static assets
```

## Setup Instructions

### 1. Database Setup

```bash
# Create the database
mysql -u root -p < lib/db/schema.sql
```

The schema creates:
- `service_calendars` - Service definitions
- `brand_calendars` - Brand/department calendars
- `employees` - Employee information
- `employee_brands` - Employee-brand associations (many-to-many)
- `bookings` - Booking records

### 2. Azure AD Setup

1. Register an app in Azure AD
2. Grant the following Microsoft Graph permissions:
   - `Calendars.ReadWrite`
   - `Calendars.ReadWrite.Shared`
3. Create a client secret
4. Get your Tenant ID and Client ID

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kf_booking_system

AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration Example

Here's how you would configure the system (can be done via database inserts):

```sql
-- Service calendars
INSERT INTO service_calendars (id, calendar_id, name, description, duration) VALUES
('svc-1', 'onboarding@kunde.dk', 'Onboarding Meeting', 'Initial onboarding', 60),
('svc-2', 'support@kunde.dk', 'Technical Support', 'Tech support session', 30);

-- Brand/department calendars
INSERT INTO brand_calendars (id, calendar_id, name) VALUES
('brand-1', 'hr@kunde.dk', 'HR Department'),
('brand-2', 'it@kunde.dk', 'IT Department');

-- Employees
INSERT INTO employees (id, primary_calendar_id, name, email) VALUES
('emp-1', 'torben@kunde.dk', 'Torben', 'torben@kunde.dk');

-- Associate employee with brands
INSERT INTO employee_brands (employee_id, brand_calendar_id) VALUES
('emp-1', 'brand-1'),  -- Torben works with HR
('emp-1', 'brand-2');  -- Torben also works with IT
```

## API Endpoints

### GET `/api/services`
Get all available services

### GET `/api/brands`
Get all brand/department calendars

### GET `/api/employees?brandId={id}`
Get employees for a specific brand

### POST `/api/availability`
Check available time slots
```json
{
  "serviceId": "svc-1",
  "brandId": "brand-1",
  "employeeId": "emp-1",
  "startDate": "2025-10-01T00:00:00Z",
  "endDate": "2025-10-15T00:00:00Z"
}
```

### POST `/api/bookings`
Create a new booking
```json
{
  "serviceId": "svc-1",
  "brandId": "brand-1",
  "employeeId": "emp-1",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+45 12345678",
  "startTime": "2025-10-05T10:00:00Z",
  "endTime": "2025-10-05T11:00:00Z"
}
```

### GET `/api/bookings?email={email}`
Get bookings for a customer

## How It Works

1. **Customer visits booking page** (`/booking`)
2. **Selects service** (e.g., "Onboarding Meeting")
3. **Selects department/brand** (e.g., "HR Department")
4. **Selects employee** (e.g., "Torben")
5. **System checks availability** across all 3 calendars
6. **Customer sees available slots** and selects one
7. **Customer enters their info** (name, email, phone)
8. **Booking is created**:
   - Event added to employee's primary calendar
   - Customer receives calendar invitation
   - Booking saved to database

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Key Features

- ✅ 3-calendar availability checking
- ✅ Real-time Microsoft Graph integration
- ✅ Multi-department/brand support
- ✅ Employee-brand associations
- ✅ Automatic calendar invitations
- ✅ Modern UI with shadcn/ui
- ✅ Full TypeScript support
- ✅ Server-side rendering with Next.js

## License

MIT
