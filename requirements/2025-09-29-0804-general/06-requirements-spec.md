# KF Insurance Booking System - Requirements Specification

## Problem Statement and Solution Overview

### Problem
KF Insurance Company, operating two brands (B1 and B2), needs a modern booking system that allows customers to schedule meetings with insurance representatives through embedded forms on the company website. The current process lacks automation, real-time availability checking, and integration with existing Microsoft 365 infrastructure.

### Solution
Build a full-stack JavaScript application using Node.js/Express backend and React.js frontend that integrates with Microsoft Bookings via Graph API, providing a seamless booking experience for customers while leveraging existing Microsoft 365 infrastructure for calendar management, notifications, and meeting scheduling.

## Functional Requirements

### 1. Customer Booking Interface
- **FR-1.1**: Embedded form on company website (iframe or JavaScript widget)
- **FR-1.2**: Support for both B1 and B2 brand experiences
- **FR-1.3**: Real-time availability display from Microsoft Bookings
- **FR-1.4**: Meeting type selection (digital/physical)
- **FR-1.5**: Date and time selection with available slots
- **FR-1.6**: Customer information collection (name, email, phone, purpose)
- **FR-1.7**: Private vs. business booking distinction
- **FR-1.8**: Document upload capability for relevant materials
- **FR-1.9**: Immediate booking confirmation to customer

### 2. Booking Management
- **FR-2.1**: Create bookings in Microsoft Bookings via Graph API
- **FR-2.2**: Automatic assignment to available representatives (later phase)
- **FR-2.3**: Immediate slot release upon cancellation
- **FR-2.4**: Prevention of double-booking through Exchange sync
- **FR-2.5**: Teams meeting link generation for digital meetings
- **FR-2.6**: Physical meeting location details for in-person meetings

### 3. Notifications
- **FR-3.1**: Email confirmation immediately after booking
- **FR-3.2**: SMS confirmation with key details
- **FR-3.3**: Reminder 24 hours before meeting
- **FR-3.4**: Reminder 1 hour before meeting
- **FR-3.5**: Brand-specific email templates (B1/B2)
- **FR-3.6**: Representative notification of new bookings

### 4. Calendar Integration
- **FR-4.1**: Two-way sync with Exchange calendars
- **FR-4.2**: Real-time availability updates
- **FR-4.3**: Automatic calendar event creation
- **FR-4.4**: Conflict detection and prevention

### 5. Document Management
- **FR-5.1**: Secure document upload during booking
- **FR-5.2**: File type validation and size limits
- **FR-5.3**: Secure storage with encryption
- **FR-5.4**: Access control for representatives
- **FR-5.5**: Document retention (manual deletion only)

### 6. Analytics and Reporting
- **FR-6.1**: Track booking sources and conversion rates
- **FR-6.2**: Representative utilization reports
- **FR-6.3**: Meeting type distribution analytics
- **FR-6.4**: Customer behavior insights
- **FR-6.5**: Export capabilities for management reports

## Technical Requirements

### 1. Architecture
- **TR-1.1**: Node.js/Express.js backend with TypeScript
- **TR-1.2**: React.js frontend with TypeScript
- **TR-1.3**: RESTful API design with versioning (v1)
- **TR-1.4**: Service layer pattern for business logic
- **TR-1.5**: Component-based frontend architecture
- **TR-1.6**: Redux Toolkit for state management
- **TR-1.7**: POC-level scaling (no high concurrency initially)

### 2. Microsoft Graph Integration
- **TR-2.1**: Microsoft Graph JavaScript SDK
- **TR-2.2**: OAuth 2.0 authentication flow
- **TR-2.3**: Bookings.ReadWrite.All permission scope
- **TR-2.4**: Use production endpoint: `/v1.0/solutions/`
- **TR-2.5**: Token caching with node-cache or Redis
- **TR-2.6**: Retry policies with axios-retry

### 3. Security
- **TR-3.1**: HTTPS/TLS 1.3 for all communications
- **TR-3.2**: JWT bearer token authentication
- **TR-3.3**: Azure AD/Entra ID integration via MSAL
- **TR-3.4**: Input validation with express-validator and React Hook Form
- **TR-3.5**: Secure document storage with multer and Azure Blob
- **TR-3.6**: CORS configuration for frontend-backend communication
- **TR-3.7**: GDPR compliance framework (user-implemented)

### 4. Performance
- **TR-4.1**: Response time <2 seconds for availability checks
- **TR-4.2**: Support for standard business load (POC level)
- **TR-4.3**: Node-cache or Redis for caching frequently accessed data
- **TR-4.4**: Bull queue for asynchronous notification processing
- **TR-4.5**: React.lazy() for code splitting and performance

### 5. Monitoring
- **TR-5.1**: Application Insights or Winston logging
- **TR-5.2**: Health check endpoints with express-healthcheck
- **TR-5.3**: Structured logging with correlation IDs using winston
- **TR-5.4**: Error tracking with Sentry or similar
- **TR-5.5**: Frontend performance monitoring with React DevTools

## Implementation Hints and Patterns

### Project Structure
```
KFInsuranceBookingSystem/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── bookingController.ts
│   │   │   ├── availabilityController.ts
│   │   │   └── documentController.ts
│   │   ├── services/
│   │   │   ├── bookingService.ts
│   │   │   ├── graphApiService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── calendarSyncService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── booking.ts
│   │   │   ├── appointment.ts
│   │   │   └── timeSlot.ts
│   │   ├── routes/
│   │   │   └── api.ts
│   │   ├── config/
│   │   │   ├── graph.ts
│   │   │   └── database.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calendar/
│   │   │   ├── Forms/
│   │   │   └── Common/
│   │   ├── pages/
│   │   │   ├── BookingPage.tsx
│   │   │   └── ConfirmationPage.tsx
│   │   ├── services/
│   │   │   └── bookingApi.ts
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   └── bookingSlice.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

### Key Implementation Patterns
1. **Availability Checking**: Query Microsoft Bookings calendar view API
2. **Booking Creation**: POST to Bookings appointments endpoint
3. **Notification Queue**: Use background service for async notifications
4. **Document Upload**: Stream directly to Azure Blob Storage
5. **Brand Routing**: Use configuration to map booking types to brands

### Microsoft Graph API Calls (TypeScript/JavaScript)
```typescript
// Get available time slots
const availability = await graphClient
  .api(`/solutions/bookingBusinesses/${businessId}/calendarView`)
  .query({
    start: startDate.toISOString(),
    end: endDate.toISOString()
  })
  .get();

// Create appointment
const appointment = await graphClient
  .api(`/solutions/bookingBusinesses/${businessId}/appointments`)
  .post({
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+1234567890",
    start: {
      dateTime: "2025-01-15T10:00:00",
      timeZone: "UTC"
    },
    end: {
      dateTime: "2025-01-15T11:00:00",
      timeZone: "UTC"
    },
    serviceId: serviceId
  });

// Get staff members
const staff = await graphClient
  .api(`/solutions/bookingBusinesses/${businessId}/staffMembers`)
  .get();
```

## Acceptance Criteria

### Booking Flow
- ✅ Customer can view real-time availability
- ✅ Customer can complete booking in <5 minutes
- ✅ Confirmation received immediately
- ✅ All notifications sent successfully
- ✅ Calendar updated in real-time

### System Integration
- ✅ Microsoft Bookings sync working
- ✅ Exchange calendar integration functional
- ✅ Teams links generated for digital meetings
- ✅ Documents uploaded securely
- ✅ Analytics data captured

### Performance
- ✅ Page load time <3 seconds
- ✅ Availability check <2 seconds
- ✅ Booking confirmation <5 seconds
- ✅ 99% uptime during business hours

## Assumptions

1. **Microsoft 365 Infrastructure**: Company has active Microsoft 365 subscription with Bookings enabled
2. **Pre-configured Entities**: Services, staff, and business hours already set up in Microsoft Bookings
3. **Single Language**: English-only interface
4. **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge latest versions)
5. **Document Types**: Standard formats (PDF, DOC, DOCX, JPG, PNG)
6. **Meeting Duration**: Predefined in Bookings service configuration
7. **Time Zone**: System operates in company's local time zone
8. **Representative Assignment**: Manual process initially, automation in future phase
9. **Compliance**: GDPR and insurance regulations handled separately by user
10. **SMS Provider**: Third-party service to be selected (Twilio, Azure Communication Services)

## Dependencies

### Backend Dependencies (npm packages)
- express - Web framework
- @microsoft/microsoft-graph-client - Graph API SDK
- @azure/msal-node - Authentication library
- typescript - Type safety
- cors - Cross-origin resource sharing
- helmet - Security headers
- multer - File upload handling
- bull - Job queue for notifications
- winston - Logging
- express-validator - Input validation
- dotenv - Environment variables

### Frontend Dependencies (npm packages)
- react - UI framework
- react-router-dom - Routing
- @reduxjs/toolkit - State management
- @microsoft/microsoft-graph-client - Graph API SDK
- @azure/msal-react - Authentication for React
- axios - HTTP client
- react-hook-form - Form handling
- @mui/material or antd - UI components
- react-calendar - Calendar component
- react-dropzone - File upload

### External Systems
- Microsoft Graph API
- Microsoft Bookings
- Exchange Online
- Microsoft Teams
- Azure AD/Entra ID
- Azure Blob Storage (for documents)
- SMS Provider API (Twilio/Azure Communication Services)

### Required Configurations
- Azure AD App Registration
- Graph API permissions (Bookings.ReadWrite.All)
- Bookings Business IDs (for B1 and B2)
- CORS allowed origins
- JWT secret for token signing
- Document storage connection strings

## Out of Scope (Phase 1 POC)

1. Automatic representative assignment algorithm
2. Multi-language support
3. High-volume concurrent booking handling
4. Mobile native applications
5. Advanced analytics dashboards
6. Booking modification by customers
7. Waitlist functionality
8. Recurring appointments
9. Group bookings
10. Payment processing

## Next Steps

1. **Environment Setup**: Configure Azure AD app registration and permissions
2. **Project Initialization**:
   - Initialize Node.js backend with Express and TypeScript
   - Create React frontend with Vite and TypeScript
3. **Graph API Integration**:
   - Implement MSAL authentication in both backend and frontend
   - Set up Graph API client and test basic calls
4. **Backend Development**:
   - Create Express routes and controllers
   - Implement Graph API service layer
   - Add validation and error handling
5. **Frontend Development**:
   - Build booking form components
   - Implement calendar availability view
   - Add state management with Redux
6. **Integration**: Connect frontend with backend API
7. **Testing**: Jest for backend, React Testing Library for frontend
8. **Documentation**: API documentation with Swagger/OpenAPI
9. **Deployment**: Docker containers deployed to Azure Container Instances or App Service