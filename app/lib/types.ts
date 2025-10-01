// Core types for the booking system

export interface ServiceCalendar {
  id: string;
  calendarId: string; // Microsoft Graph calendar ID (e.g., onboarding@kunde.dk)
  name: string;
  description: string;
  duration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandCalendar {
  id: string;
  calendarId: string; // Microsoft Graph calendar ID (e.g., hr@kunde.dk)
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  primaryCalendarId: string; // Primary calendar (e.g., torben@kunde.dk)
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeBrand {
  employeeId: string;
  brandCalendarId: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  serviceCalendarId: string;
  brandCalendarId: string;
  employeeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  graphEventId?: string; // Microsoft Graph event ID
  createdAt: Date;
  updatedAt: Date;
}

// Availability check result
export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

// Settings format (as specified by user)
export interface SystemSettings {
  tjenester: Array<{
    calendarId: string;
    navn: string;
    description: string;
    duration: number;
  }>;
  brands: Array<{
    calendarId: string;
    navn: string;
    description?: string;
  }>;
  employees: Array<{
    id: string;
    name: string;
    primaryCalendar: string;
    brands: string[]; // Array of brand calendar IDs
  }>;
}
