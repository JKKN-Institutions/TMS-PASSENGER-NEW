import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const userId = searchParams.get('userId');

    if (!userEmail && !userId) {
      return NextResponse.json(
        { success: false, error: 'User email or ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build query based on available parameters
    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (userEmail) {
      query = query.eq('reporter_email', userEmail);
    } else if (userId) {
      query = query.eq('reported_by', userId);
    }

    const { data: bugReports, error } = await query;

    if (error) {
      console.error('Error fetching user bug reports:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bug reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bugReports: bugReports || []
    });

  } catch (error) {
    console.error('Error in user bug reports fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bugReportData = JSON.parse(formData.get('bugReport') as string);
    const files = formData.getAll('files') as File[];

    console.log('🐛 Bug report submission received:', {
      title: bugReportData.title,
      reporter: bugReportData.reporterEmail,
      filesCount: files.length
    });

    const supabase = createClient();

    // Generate unique ID for this bug report
    const bugReportId = crypto.randomUUID();
    let screenshotUrl = null;

    // Handle file uploads (screenshots)
    if (files.length > 0) {
      console.log('📎 Processing files...');
      
      for (const file of files) {
        if (file.size > 0) {
          try {
            const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
            const filePath = `bug-reports/${bugReportId}/${fileName}`;

            console.log('📤 Uploading file:', filePath);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('bug-screenshots')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('📤 Upload error:', uploadError);
              throw uploadError;
            }

            console.log('✅ File uploaded successfully:', uploadData.path);

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('bug-screenshots')
              .getPublicUrl(uploadData.path);

            screenshotUrl = urlData.publicUrl;
            console.log('🔗 Public URL generated:', screenshotUrl);

            break; // Use first valid file as screenshot
          } catch (fileError) {
            console.error('❌ File upload failed:', fileError);
            // Continue without screenshot if upload fails
          }
        }
      }
    }

    // Generate UUID for reported_by if needed
    let reportedBy = bugReportData.reporterId;
    if (!reportedBy || typeof reportedBy !== 'string' || reportedBy.length < 10) {
      // Generate a deterministic UUID based on email
      reportedBy = crypto.randomUUID();
      console.log('🔑 Generated UUID for reported_by:', reportedBy);
    }

    // Prepare bug report data to match actual database schema
    // Combine steps, expected, and actual behavior into description
    let fullDescription = bugReportData.description;
    
    if (bugReportData.stepsToReproduce) {
      fullDescription += `\n\n**Steps to Reproduce:**\n${bugReportData.stepsToReproduce}`;
    }
    
    if (bugReportData.expectedBehavior) {
      fullDescription += `\n\n**Expected Behavior:**\n${bugReportData.expectedBehavior}`;
    }
    
    if (bugReportData.actualBehavior) {
      fullDescription += `\n\n**Actual Behavior:**\n${bugReportData.actualBehavior}`;
    }

    const dbBugReport = {
      id: bugReportId,
      title: bugReportData.title,
      description: fullDescription,
      category: bugReportData.category || 'functionality',
      priority: bugReportData.severity || 'medium', // Map severity to priority
      status: 'open',
      reported_by: reportedBy,
      reporter_name: bugReportData.reporterName || bugReportData.reporterEmail.split('@')[0],
      reporter_email: bugReportData.reporterEmail,
      reporter_type: 'student',
      screenshot_url: screenshotUrl,
      browser_info: bugReportData.systemInfo?.browser || null,
      device_info: bugReportData.systemInfo?.deviceInfo || null,
      screen_resolution: bugReportData.systemInfo?.screenResolution || null,
      user_agent: bugReportData.systemInfo?.userAgent || null,
      page_url: bugReportData.systemInfo?.currentPage || null,
      tags: null,
      is_duplicate: false,
      duplicate_of: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Inserting bug report into database...');

    // Insert bug report into database
    const { data: insertData, error: insertError } = await supabase
      .from('bug_reports')
      .insert([dbBugReport])
      .select()
      .single();

    if (insertError) {
      console.error('💾 Database insertion failed:', insertError);
      throw insertError;
    }

    console.log('✅ Bug report created successfully:', insertData.id);

    return NextResponse.json({
      success: true,
      bugReport: insertData,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('❌ Bug report submission failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit bug report'
      },
      { status: 500 }
    );
  }
}