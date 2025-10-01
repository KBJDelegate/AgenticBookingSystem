#!/usr/bin/env node

/**
 * Script to manually trigger cancellation sync
 * This checks all brand calendar events and cancels those where
 * the MS Bookings appointment no longer exists
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

async function syncCancellations() {
  console.log('🔄 Syncing cancellations from MS Bookings to brand calendars...\n');

  try {
    const response = await fetch(`${baseUrl}/api/sync/cancellations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('✅ Sync completed!\n');
    console.log(`Message: ${data.message}\n`);

    if (data.results && data.results.length > 0) {
      console.log('Results:');
      data.results.forEach(result => {
        if (result.status === 'cancelled') {
          console.log(`  ✗ Cancelled: ${result.subject} (${result.brand})`);
          console.log(`    Reason: ${result.reason}`);
        } else if (result.status === 'error') {
          console.log(`  ⚠️  Error: ${result.brand}`);
          console.log(`    Error: ${result.error}`);
        }
      });
    } else {
      console.log('No events needed cancellation.');
    }
  } catch (error) {
    console.error('❌ Error syncing cancellations:', error.message);
    process.exit(1);
  }
}

syncCancellations();
