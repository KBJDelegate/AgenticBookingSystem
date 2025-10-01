import { config } from 'dotenv';
import { resolve } from 'path';
import { getGraphClient } from '../lib/graph/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

async function fetchAllBookingsData() {
  const client = getGraphClient();

  try {
    console.log('Fetching all MS Bookings businesses...\n');

    // Fetch all booking businesses
    const businessesResponse = await client
      .api('/solutions/bookingBusinesses')
      .get();

    const businesses = businessesResponse.value;
    console.log(`Found ${businesses.length} booking businesses:\n`);

    for (const business of businesses) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Business: ${business.displayName}`);
      console.log(`ID: ${business.id}`);
      console.log(`Email: ${business.email}`);
      console.log(`Phone: ${business.phone || 'N/A'}`);
      console.log(`Address: ${business.address ? JSON.stringify(business.address) : 'N/A'}`);
      console.log(`${'='.repeat(80)}\n`);

      // Fetch staff members for this business
      try {
        const staffResponse = await client
          .api(`/solutions/bookingBusinesses/${business.id}/staffMembers`)
          .get();

        const staff = staffResponse.value;
        console.log(`Staff members (${staff.length}):`);

        for (const member of staff) {
          console.log(`  - ${member.displayName}`);
          console.log(`    Email: ${member.emailAddress}`);
          console.log(`    Role: ${member.role || 'N/A'}`);
          console.log(`    ID: ${member.id}`);
          console.log();
        }
      } catch (error: any) {
        console.error(`  Error fetching staff: ${error.message}`);
      }

      console.log('\n');
    }

    // Output JSON structure for settings.json
    console.log('\n' + '='.repeat(80));
    console.log('SUGGESTED settings.json STRUCTURE:');
    console.log('='.repeat(80) + '\n');

    const settingsStructure = {
      brands: businesses.map((business: any) => ({
        id: business.displayName.toLowerCase().replace(/\s+/g, ''),
        name: business.displayName,
        domain: business.email?.split('@')[1] || 'example.com',
        calendarId: business.email || '',
        msBookingsBusinessId: business.id,
      })),
      employees: [] as any[],
    };

    // Fetch all staff for all businesses and consolidate
    const allStaff = new Map();

    for (const business of businesses) {
      try {
        const staffResponse = await client
          .api(`/solutions/bookingBusinesses/${business.id}/staffMembers`)
          .get();

        for (const member of staffResponse.value) {
          if (!allStaff.has(member.emailAddress)) {
            allStaff.set(member.emailAddress, {
              id: member.emailAddress.split('@')[0],
              name: member.displayName,
              email: member.emailAddress,
              primaryCalendarId: member.emailAddress,
              brands: [settingsStructure.brands.find((b: any) => b.msBookingsBusinessId === business.id)?.id],
            });
          } else {
            const existing = allStaff.get(member.emailAddress);
            const brandId = settingsStructure.brands.find((b: any) => b.msBookingsBusinessId === business.id)?.id;
            if (brandId && !existing.brands.includes(brandId)) {
              existing.brands.push(brandId);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching staff for ${business.displayName}`);
      }
    }

    settingsStructure.employees = Array.from(allStaff.values());

    console.log(JSON.stringify(settingsStructure, null, 2));

  } catch (error: any) {
    console.error('Error fetching bookings data:', error.message);
    if (error.body) {
      console.error('Error details:', error.body);
    }
  }
}

fetchAllBookingsData();
