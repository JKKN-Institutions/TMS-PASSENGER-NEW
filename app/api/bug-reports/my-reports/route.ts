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
      `${apiUrl}/api/v1/public/bug-reports/me?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
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

    const result = await response.json();

    // The API returns: { success: true, data: { bug_reports: [...], pagination: {...} } }
    const bugReports = result?.data?.bug_reports || [];
    const pagination = result?.data?.pagination || {};

    // Transform bug reports to match our interface
    const reports = bugReports.map((report: any) => ({
      id: report.id,
      title: report.metadata?.title || report.display_id,
      description: report.description,
      status: report.status,
      priority: report.metadata?.priority || 'medium',
      category: report.category,
      created_at: report.created_at,
      updated_at: report.created_at,
      page_url: report.page_url,
      screenshot_url: report.screenshot_url,
      console_logs: report.console_logs,
      browser_info: {
        userAgent: report.metadata?.browser_info,
        platform: report.metadata?.system_info,
        screenResolution: report.metadata?.screen_resolution,
      },
      user_context: {
        userId: report.reporter_user_id || 'unknown',
        name: report.metadata?.reporter_name || 'Unknown',
        email: report.metadata?.reporter_email || '',
      },
      resolution: report.resolved_at ? 'Resolved' : undefined,
    }));

    return NextResponse.json({
      success: true,
      reports,
      total: pagination.total || reports.length,
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
