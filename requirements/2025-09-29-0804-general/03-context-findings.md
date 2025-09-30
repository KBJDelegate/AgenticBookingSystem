# Context Findings

## Technology Stack Recommendation

Based on research and your requirements, the recommended technology stack is:

### Backend
- **Node.js** - JavaScript runtime for backend services
- **Express.js** - Web framework for RESTful API
- **Microsoft Graph JavaScript SDK** - Official SDK for Bookings API integration
- **Passport.js** - Authentication middleware for Node.js
- **TypeScript** - For type safety and better developer experience

### Frontend
- **React.js** - Component-based UI framework
- **React Router** - For navigation and routing
- **Redux Toolkit** - State management for complex data flows
- **Material-UI or Ant Design** - Component library for consistent UI
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation

### Authentication & Authorization
- **Microsoft Authentication Library (MSAL.js)** - For browser-based auth
- **MSAL Node** - For server-side token management
- **JWT** - JSON Web Tokens for session management
- **Azure AD/Entra ID** - For identity management

### Development Tools
- **Vite** - Fast build tool for React development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest & React Testing Library** - Testing framework

## Microsoft Graph API Integration Details

### Key API Endpoints
- **Base URL**: `https://graph.microsoft.com/v1.0/solutions/bookingBusinesses/`
- **Create Appointment**: `POST {businessId}/appointments`
- **Get Availability**: `GET {businessId}/calendarView`
- **Manage Services**: `GET/POST {businessId}/services`
- **Manage Staff**: `GET/POST {businessId}/staffMembers`

### Required Permissions
- **Bookings.ReadWrite.All** - For full access to Bookings data
- **Calendars.ReadWrite** - For calendar synchronization
- **User.Read** - For user profile information

### Important Breaking Changes (2024)
- API path changed from `/beta` to `/beta/solutions` (effective April 30, 2024)
- Use `/v1.0/solutions` for production APIs

## Architecture Patterns

### Recommended Architecture
1. **Microservices Pattern** - Separate frontend and backend services
2. **RESTful API** - Standard HTTP/JSON communication
3. **Service Layer** - Business logic separation in Node.js
4. **Component-Based UI** - Reusable React components
5. **State Management** - Centralized state with Redux

### Project Structure (Suggested)
```
KFInsuranceBookingSystem/
├── backend/                      # Node.js backend
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, validation, etc.
│   │   ├── models/              # Data models
│   │   ├── routes/              # API routes
│   │   ├── utils/               # Helper functions
│   │   └── config/              # Configuration files
│   ├── tests/                   # Backend tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # React.js frontend
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── store/               # Redux store
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Helper functions
│   │   └── styles/              # CSS/SCSS files
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── docs/
```

## Integration Points Identified

### 1. Microsoft Bookings Integration
- Create/update bookings in Bookings calendar
- Sync availability from Exchange calendars
- Generate Teams meeting links for digital meetings

### 2. Exchange Calendar Integration
- Two-way sync with representative calendars
- Real-time availability checking
- Calendar event creation with meeting details

### 3. Notification Services
- Email via Microsoft Graph Mail API or SMTP
- SMS via third-party provider (Twilio, Azure Communication Services)
- Teams notifications via Graph API

### 4. Document Storage
- Azure Blob Storage for secure document upload
- Integration with SharePoint (optional)
- Access control via Azure AD

## Technical Constraints and Considerations

### Performance
- POC level: No high concurrency requirements initially
- Use in-memory caching for token management
- Consider Redis cache for future scaling

### Security
- All communications over HTTPS/TLS 1.3
- Token-based authentication
- Secure document storage with encryption at rest
- GDPR compliance (handled by user)

### Monitoring & Analytics
- Application Insights for telemetry
- Custom reporting dashboard
- Integration with PowerBI (future enhancement)

## Similar Features Analysis

### Common Booking System Patterns
1. **Time Slot Management**
   - 15/30/60-minute intervals
   - Business hours configuration
   - Holiday/exception handling

2. **Booking Workflow**
   - Select service → Choose time → Enter details → Confirm
   - Real-time availability updates
   - Conflict prevention

3. **Notification Flow**
   - Immediate confirmation (email + SMS)
   - Reminder 24 hours before
   - Reminder 1 hour before
   - Cancellation/rescheduling notifications

## Files That Need Implementation

### Backend (Node.js/TypeScript)
- `backend/src/app.ts` - Express application setup
- `backend/src/server.ts` - Server entry point
- `backend/src/controllers/bookingController.ts` - Booking endpoints
- `backend/src/controllers/availabilityController.ts` - Availability checking
- `backend/src/services/graphApiService.ts` - Microsoft Graph API wrapper
- `backend/src/services/bookingService.ts` - Business logic
- `backend/src/services/notificationService.ts` - Email/SMS notifications
- `backend/src/middleware/auth.ts` - Authentication middleware
- `backend/src/models/booking.ts` - Booking data model
- `backend/src/config/graph.ts` - Graph API configuration
- `backend/.env` - Environment variables

### Frontend (React.js/TypeScript)
- `frontend/src/App.tsx` - Main application component
- `frontend/src/pages/BookingForm.tsx` - Booking form page
- `frontend/src/components/Calendar/AvailabilityCalendar.tsx` - Calendar component
- `frontend/src/components/Forms/CustomerDetailsForm.tsx` - Customer info form
- `frontend/src/components/Forms/DocumentUpload.tsx` - File upload component
- `frontend/src/services/bookingApi.ts` - API service layer
- `frontend/src/store/bookingSlice.ts` - Redux slice for bookings
- `frontend/src/hooks/useAvailability.ts` - Custom hook for availability
- `frontend/src/utils/dateHelpers.ts` - Date utility functions
- `frontend/src/config/brands.ts` - B1/B2 brand configuration

## Best Practices to Follow

1. **Use Dependency Injection** - For all services and configurations
2. **Implement Circuit Breaker** - For external API calls
3. **Add Retry Policies** - For transient failures
4. **Log Everything** - Structured logging with correlation IDs
5. **Validate Input** - Both client and server-side
6. **Use DTOs** - Separate API models from domain models
7. **Implement Health Checks** - For monitoring system status
8. **Version Your API** - Start with v1 from the beginning