import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/config/settings';

export async function GET(request: NextRequest) {
  try {
    const settings = getSettings();

    return NextResponse.json({ brands: settings.brands });
  } catch (error) {
    console.error('Error fetching brands from config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
