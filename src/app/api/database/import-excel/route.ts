import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';
import { getExcelService } from '@/lib/excelService';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase not configured. Please set up your environment variables in .env.local' 
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file provided' 
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse Excel file
    const excelService = getExcelService();
    const members = excelService.parseExcelToMembers(buffer);

    if (members.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No valid members found in Excel file' 
        },
        { status: 400 }
      );
    }

    // Import to database
    const database = getDatabaseService();
    const result = await database.importMembersTo2025(members);

    return NextResponse.json({
      success: true,
      data: {
        imported: result.success,
        errors: result.errors,
        total: members.length,
        message: `Successfully imported ${result.success} out of ${members.length} members`
      }
    });
  } catch (error) {
    console.error('Error importing Excel file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to import Excel file' 
      },
      { status: 500 }
    );
  }
}
