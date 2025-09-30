# KF Insurance Booking System

## Overview
A modern web-based booking system that allows insurance customers to schedule meetings with representatives through an intuitive interface. The system integrates with Microsoft 365 infrastructure (Bookings, Exchange, Teams) to provide seamless calendar management and meeting coordination.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Customer Browser                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React.js Frontend Application           │   │
│  │                                                      │   │
│  │  • Booking Form    • Calendar View                  │   │
│  │  • Document Upload • Confirmation Page              │   │
│  └──────────────────────┬───────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTPS/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js/Express Backend API                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │  Controllers │  │   Services   │     │
│  │              │──│              │──│              │     │
│  │ • /booking   │  │ • Validation │  │ • Business   │     │
│  │ • /available │  │ • Auth       │  │   Logic      │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
└────────────────────────────────────────────┼───────────────┘
                                             │
                         ┌───────────────────┼───────────────┐
                         ▼                   ▼               ▼
         ┌──────────────────────┐ ┌──────────────┐ ┌──────────────┐
         │ Microsoft Graph API   │ │ Azure Blob   │ │ SMS Provider │
         │                       │ │  Storage     │ │  (Twilio)    │
         │ • Bookings API       │ │              │ │              │
         │ • Calendar API       │ │ • Document   │ │ • SMS        │
         │ • Teams API          │ │   Storage    │ │   Delivery   │
         │ • Mail API           │ │              │ │              │
         └──────────────────────┘ └──────────────┘ └──────────────┘
```


## Technical Stack

### Frontend
- **React.js** - UI framework for interactive components
- **TypeScript** - Type safety and better developer experience
- **Redux Toolkit** - State management for complex data flows
- **Material-UI** - Professional UI components
- **Vite** - Fast build tool and dev server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type safety across the stack
- **Microsoft Graph SDK** - Official SDK for Microsoft 365 integration
- **Passport.js** - Authentication middleware

### Infrastructure
- **Azure AD** - Identity and access management
- **Microsoft Bookings** - Calendar and appointment management
- **Docker** - Containerization for easy deployment

## How It Works

### 1. Booking Flow
```
Customer Journey:
1. Opens booking form on website
2. Selects meeting type (Digital/Physical)
3. Chooses from available time slots
4. Enters personal information
5. Uploads relevant documents (optional)
6. Submits booking request
7. Receives instant confirmation
```

### 2. Backend Processing
```
System Processing:
1. Validates customer input
2. Checks availability via Microsoft Graph API
3. Creates booking in Microsoft Bookings
4. Generates Teams meeting (if digital)
5. Stores documents in Azure Blob
6. Sends email confirmation
7. Sends SMS notification
8. Updates representative's calendar
```

### 3. Data Flow
- **Availability Check**: Backend → Graph API → Microsoft Bookings → Response
- **Booking Creation**: Frontend → Backend → Graph API → Bookings/Calendar
- **Notifications**: Backend → Email Service + SMS Provider
- **Document Storage**: Frontend → Backend → Azure Blob Storage

## Project Structure
```
KFInsuranceBookingSystem/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   └── config/         # Configuration
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── store/         # Redux state
│   └── package.json
└── docker-compose.yml      # Container orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Azure AD tenant with admin access
- Microsoft 365 Business with Bookings enabled

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration
1. Set up Azure AD App Registration
2. Configure Microsoft Bookings business
3. Set environment variables (see .env.example)
4. Configure brand settings

### Running the Application
```bash
# Start backend (from backend/ directory)
npm run dev

# Start frontend (from frontend/ directory)
npm run dev

# Or use Docker
docker-compose up
```
