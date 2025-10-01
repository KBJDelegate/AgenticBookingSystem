# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Azure AD app configured with Calendar permissions

## Step 1: Configure Azure Credentials

Edit `/workspaces/KFInsuranceBookingSystem/app/.env.local` and fill in your Azure credentials:

```env
AZURE_TENANT_ID=your-actual-tenant-id
AZURE_CLIENT_ID=your-actual-client-id
AZURE_CLIENT_SECRET=your-actual-client-secret
```

## Step 2: Start MySQL Database

From the project root:

```bash
cd /workspaces/KFInsuranceBookingSystem
docker-compose up -d mysql
```

This will:
- Start MySQL on port 3306
- Automatically create the `kf_booking_system` database
- Run the schema.sql to create all tables
- Insert sample data

Wait about 10 seconds for MySQL to fully initialize.

## Step 3: Start the Next.js Application

```bash
cd /workspaces/KFInsuranceBookingSystem/app
npm run dev
```

## Step 4: Access the Application

- **Booking Page**: http://localhost:3000/booking
- **Home Page**: http://localhost:3000

## Troubleshooting

### Check if MySQL is running:
```bash
docker ps | grep mysql
```

### View MySQL logs:
```bash
docker logs kf-booking-mysql
```

### Connect to MySQL to verify schema:
```bash
docker exec -it kf-booking-mysql mysql -uroot -prootpassword kf_booking_system -e "SHOW TABLES;"
```

### Stop MySQL:
```bash
docker-compose down
```

### Reset database (delete all data):
```bash
docker-compose down -v
docker-compose up -d mysql
```

## Database Credentials

- **Host**: localhost
- **Port**: 3306
- **User**: root
- **Password**: rootpassword
- **Database**: kf_booking_system
