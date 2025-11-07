import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or auth header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get Bug Reporter platform configuration
    const apiKey = process.env.NEXT_PUBLIC_BUG_REPORTER_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: 'Bug Reporter platform not configured' },
        { status: 503 }
      );
    }

    // Fetch user's bug reports from Bug Reporter platform
    const response = await fetch(
      `${apiUrl}/api/v1/public/bug-reports?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Bug Reporter API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch bug reports', details: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      reports: data.reports || data || [],
      total: data.total || (Array.isArray(data) ? data.length : 0),
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch bug reports',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
