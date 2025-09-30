const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');
require('dotenv').config();

async function testBookingsAccess() {
  try {
    console.log('Testing Microsoft Bookings access...');
    console.log('Tenant:', process.env.AZURE_TENANT_ID);
    console.log('Client ID:', process.env.AZURE_CLIENT_ID);

    // Initialize MSAL client
    const msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET
      }
    });

    // Get access token
    const authResult = await msalClient.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!authResult) {
      throw new Error('Failed to acquire token');
    }

    console.log('✅ Successfully authenticated with Microsoft Graph');

    // Create Graph client
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, authResult.accessToken);
      }
    });

    // Test 1: Get all booking businesses
    console.log('\n=== Testing: Get all booking businesses ===');
    try {
      const businessesResponse = await graphClient
        .api('/solutions/bookingBusinesses')
        .get();

      console.log('✅ Success! Found', businessesResponse.value?.length || 0, 'booking businesses:');
      businessesResponse.value?.forEach((business, i) => {
        console.log(`  ${i + 1}. ID: ${business.id}`);
        console.log(`     Display Name: ${business.displayName}`);
        console.log(`     Email: ${business.email}`);
        console.log(`     Phone: ${business.phone}`);
        console.log('     ---');
      });

      // Test services for ALL businesses
      if (businessesResponse.value?.length > 0) {
        for (let business of businessesResponse.value) {
          console.log(`\n=== Testing: Get services for business ${business.displayName} (${business.id}) ===`);

          try {
            const servicesResponse = await graphClient
              .api(`/solutions/bookingBusinesses/${business.id}/services`)
              .get();

            console.log('✅ Success! Found', servicesResponse.value?.length || 0, 'services:');
            servicesResponse.value?.forEach((service, i) => {
              console.log(`  ${i + 1}. ID: ${service.id}`);
              console.log(`     Display Name: ${service.displayName}`);
              console.log(`     Duration: ${service.defaultDuration}`);
              console.log(`     Price: ${service.defaultPrice?.amount || 'Free'}`);
              console.log(`     Is Active: ${service.isActive !== false ? 'Yes' : 'No'}`);
              console.log(`     Staff Members: ${service.staffMemberIds?.length || 0} assigned`);
              console.log('     ---');
            });

          } catch (error) {
            console.log('❌ Error getting services:', error.message);
          }
        }
      }

    } catch (error) {
      console.log('❌ Error getting booking businesses:', error.message);
    }

    // Test 2: Test the current configured business ID
    const currentBusinessId = process.env.BOOKING_BUSINESS_ID;
    console.log(`\n=== Testing: Current configured business ID: ${currentBusinessId} ===`);

    try {
      const businessResponse = await graphClient
        .api(`/solutions/bookingBusinesses/${currentBusinessId}`)
        .get();

      console.log('✅ Success! Current business details:');
      console.log(`  Display Name: ${businessResponse.displayName}`);
      console.log(`  Email: ${businessResponse.email}`);
      console.log(`  Phone: ${businessResponse.phone}`);

    } catch (error) {
      console.log('❌ Error accessing current business ID:', error.message);
      console.log('   This might explain why bookings are failing!');
    }

  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
  }
}

testBookingsAccess();