-- KF Insurance Booking System Database Schema
-- New architecture supporting service, brand, and employee calendars

CREATE DATABASE IF NOT EXISTS kf_booking_system;
USE kf_booking_system;

-- Service Calendars (e.g., onboarding@kunde.dk, support@kunde.dk)
CREATE TABLE service_calendars (
    id VARCHAR(36) PRIMARY KEY,
    calendar_id VARCHAR(255) UNIQUE NOT NULL, -- Microsoft Graph calendar ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL DEFAULT 30, -- meeting duration in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendar_id (calendar_id)
);

-- Brand/Department Calendars (e.g., hr@kunde.dk, it@kunde.dk, torben@brand.dk)
CREATE TABLE brand_calendars (
    id VARCHAR(36) PRIMARY KEY,
    calendar_id VARCHAR(255) UNIQUE NOT NULL, -- Microsoft Graph calendar ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendar_id (calendar_id)
);

-- Employees
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    primary_calendar_id VARCHAR(255) UNIQUE NOT NULL, -- Primary calendar (e.g., torben@kunde.dk)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_primary_calendar (primary_calendar_id)
);

-- Employee-Brand relationship (many-to-many)
-- Maps which brand calendars an employee is associated with
CREATE TABLE employee_brands (
    employee_id VARCHAR(36) NOT NULL,
    brand_calendar_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, brand_calendar_id),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_calendar_id) REFERENCES brand_calendars(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_brand (brand_calendar_id)
);

-- Bookings
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    service_calendar_id VARCHAR(36) NOT NULL,
    brand_calendar_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    graph_event_id VARCHAR(255), -- Microsoft Graph event ID for tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_calendar_id) REFERENCES service_calendars(id),
    FOREIGN KEY (brand_calendar_id) REFERENCES brand_calendars(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    INDEX idx_service (service_calendar_id),
    INDEX idx_brand (brand_calendar_id),
    INDEX idx_employee (employee_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
);

-- Sample data for testing
INSERT INTO service_calendars (id, calendar_id, name, description, duration) VALUES
('svc-1', 'onboarding@kunde.dk', 'Onboarding Meeting', 'Initial onboarding session for new clients', 60),
('svc-2', 'support@kunde.dk', 'Technical Support', 'Technical support session', 30);

INSERT INTO brand_calendars (id, calendar_id, name, description) VALUES
('brand-1', 'hr@kunde.dk', 'HR Department', 'HR department calendar'),
('brand-2', 'it@kunde.dk', 'IT Department', 'IT department calendar');

INSERT INTO employees (id, primary_calendar_id, name, email) VALUES
('emp-1', 'torben@kunde.dk', 'Torben', 'torben@kunde.dk');

INSERT INTO employee_brands (employee_id, brand_calendar_id) VALUES
('emp-1', 'brand-1'),
('emp-1', 'brand-2');
