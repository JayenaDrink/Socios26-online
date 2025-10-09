import { NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/googleDrive';

export async function GET() {
  try {
    const googleDrive = getGoogleDriveService();
    const excelFiles = await googleDrive.findExcelFiles();

    return NextResponse.json({
      success: true,
      data: excelFiles
    });
  } catch (error) {
    console.error('Error getting Excel files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get Excel files' 
      },
      { status: 500 }
    );
  }
}
