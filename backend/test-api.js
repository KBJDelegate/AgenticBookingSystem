const { GraphApiService } = require('./dist/services/graphApiService');

async function testBookingBusinessAPI() {
  console.log('Testing Booking Business API...');
  console.log('Current Booking Business ID:', process.env.BOOKING_BUSINESS_ID);

  try {
    const service = new (require('./dist/services/graphApiService').default.constructor)();

    // Test getting all booking businesses
    console.log('\n1. Testing getBookingBusinesses...');
    const businesses = await service.getBookingBusinesses();
    console.log('Available booking businesses:', JSON.stringify(businesses, null, 2));

    // Test getting specific business details
    console.log('\n2. Testing getBusinessDetails...');
    const businessDetails = await service.getBusinessDetails();
    console.log('Business details:', JSON.stringify(businessDetails, null, 2));

    // Test getting services
    console.log('\n3. Testing getServices...');
    const services = await service.getServices();
    console.log('Available services:', JSON.stringify(services, null, 2));

  } catch (error) {
    console.error('Error testing APIs:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
  }
}

// Load environment variables first
require('dotenv').config();
testBookingBusinessAPI();