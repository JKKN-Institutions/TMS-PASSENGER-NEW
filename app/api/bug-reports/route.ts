import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// File upload handler
async function uploadFile(file: File, bugReportId: string, uploadedBy: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bugReportId}/${uuidv4()}.${fileExt}`;
    const filePath = `bug-reports/${fileName}`;

    const { data, error } = await supabase.storage
      .from('bug-attachments')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Save file record to database
    const { error: dbError } = await supabase
      .from('bug_attachments')
      .insert({
        bug_report_id: bugReportId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_path: filePath,
        is_screenshot: file.name.includes('screenshot'),
        uploaded_by_id: uploadedBy,
        uploaded_by_name: 'User' // This should come from user data
      });

    if (dbError) {
      console.error('Error saving file record:', dbError);
      return null;
    }

    return filePath;
  } catch (error) {
    console.error('Error in file upload:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bugReportData = JSON.parse(formData.get('bugReport') as string);
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!bugReportData.title || !bugReportData.description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!bugReportData.reporterId || !bugReportData.reporterEmail) {
      return NextResponse.json(
        { success: false, error: 'Reporter information is required' },
        { status: 400 }
      );
    }

    // Create bug report
    const bugReportId = uuidv4();
    const { data: bugReport, error: bugError } = await supabase
      .from('bug_reports')
      .insert({
        id: bugReportId,
        title: bugReportData.title,
        description: bugReportData.description,
        steps_to_reproduce: bugReportData.stepsToReproduce,
        expected_behavior: bugReportData.expectedBehavior,
        actual_behavior: bugReportData.actualBehavior,
        category: bugReportData.category,
        severity: bugReportData.severity,
        priority: 'normal', // Default priority
        status: 'open',
        reporter_type: 'student',
        reporter_id: bugReportData.reporterId,
        reporter_name: bugReportData.reporterName,
        reporter_email: bugReportData.reporterEmail,
        browser_info: {
          userAgent: bugReportData.systemInfo.userAgent,
          deviceInfo: bugReportData.systemInfo.deviceInfo
        },
        screen_resolution: bugReportData.systemInfo.screenResolution,
        user_agent: bugReportData.systemInfo.userAgent,
        page_url: bugReportData.systemInfo.url
      })
      .select()
      .single();

    if (bugError) {
      console.error('Error creating bug report:', bugError);
      return NextResponse.json(
        { success: false, error: 'Failed to create bug report' },
        { status: 500 }
      );
    }

    // Upload files if any
    const uploadPromises = files.map(file => 
      uploadFile(file, bugReportId, bugReportData.reporterId)
    );

    const uploadResults = await Promise.all(uploadPromises);
    const failedUploads = uploadResults.filter(result => result === null).length;

    if (failedUploads > 0) {
      console.warn(`${failedUploads} files failed to upload`);
    }

    // Create initial comment with system info
    await supabase
      .from('bug_comments')
      .insert({
        bug_report_id: bugReportId,
        comment_text: `System Information:\n${JSON.stringify(bugReportData.systemInfo, null, 2)}`,
        is_internal: true,
        commenter_type: 'student',
        commenter_id: bugReportData.reporterId,
        commenter_name: bugReportData.reporterName
      });

    return NextResponse.json({
      success: true,
      bugReportId: bugReportId,
      uploadedFiles: files.length - failedUploads,
      failedUploads: failedUploads,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Error in bug report submission:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('bug_reports')
      .select(`
        *,
        bug_attachments(*)
      `)
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bugReports, error } = await query;

    if (error) {
      console.error('Error fetching bug reports:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bug reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReports: bugReports || [],
      pagination: {
        limit,
        offset,
        hasMore: (bugReports?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Error in bug reports fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
