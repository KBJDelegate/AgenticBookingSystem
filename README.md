# KF Insurance Booking System

## Overview
A modern web-based booking system that allows insurance customers to schedule meetings with representatives through an intuitive interface. The system integrates with Microsoft 365 infrastructure (Bookings, Exchange, Teams) to provide seamless calendar management and meeting coordination.

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
         ┌──────────────────────┐ ┌──────────────┐
         │ Microsoft Graph API   │ │ MySQL        │
         │                       │ │  Database    │
         │ • Bookings API       │ │              │
         │ • Calendar API       │ │ • Bookings   │
         │ • Teams API          │ │ • Users      │
         │ • Mail API           │ │              │
         └──────────────────────┘ └──────────────┘
```

## Technical Stack

### Frontend & Backend
- **Next.js 15** - React framework with App Router (Server & Client Components)
- **TypeScript** - Type safety across the stack
- **React 19** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Database & Infrastructure
- **MySQL 8.0** - Relational database
- **Microsoft Graph SDK** - Official SDK for Microsoft 365 integration
- **Azure AD** - Identity and access management
- **Docker** - Containerization for easy deployment

## How It Works

### 1. Booking Flow
```
Customer Journey:
1. Opens booking form on website
2. Selects meeting type (Digital/Physical)
3. Chooses from available time slots
4. Enters personal information
5. Submits booking request
6. Receives instant confirmation
```

### 2. System Processing
```
Next.js Processing:
1. Validates customer input (Server-side)
2. Checks availability via Microsoft Graph API
3. Creates booking in Microsoft Bookings
4. Stores booking in MySQL database
5. Generates Teams meeting (if digital)
6. Sends email confirmation
7. Updates representative's calendar
```

### 3. Data Flow
- **Availability Check**: Client → Next.js API Route → Graph API → Microsoft Bookings
- **Booking Creation**: Client → Next.js API Route → MySQL + Graph API
- **Notifications**: Next.js API Route → Email Service

## Project Structure
```
KFInsuranceBookingSystem/
├── app/                     # Next.js application
│   ├── app/                # App Router directory
│   │   ├── api/           # API routes
│   │   ├── booking/       # Booking pages
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── lib/              # Utilities & services
│   │   ├── db/           # Database utilities
│   │   └── auth/         # Azure AD auth
│   ├── .env.local        # Environment variables
│   └── package.json
└── docker-compose.yml     # Container orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Azure AD tenant with admin access
- Microsoft 365 Business with Bookings enabled
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
1. Set up Azure AD App Registration
2. Configure Microsoft Bookings business
3. Copy `.env.example` to `.env.local` and fill in:
   - Azure AD credentials (tenant ID, client ID, client secret)
   - MySQL database connection
4. Set up MySQL database (use Docker or local MySQL)

### Running the Application
```bash
# Start MySQL with Docker
docker-compose up mysql -d

# Start Next.js development server (from app/ directory)
npm run dev

# Or use Docker for everything
docker-compose up
```

The application will be available at http://localhost:3000
