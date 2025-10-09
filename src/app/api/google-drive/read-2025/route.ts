import { NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/googleDrive';
import { getExcelService } from '@/lib/excelService';

export async function GET() {
  try {
    const googleDrive = getGoogleDriveService();
    const excelService = getExcelService();

    // Find the 2025 Excel file
    const excelFiles = await googleDrive.findExcelFiles();
    
    if (!excelFiles.list2025) {
      return NextResponse.json(
        { 
          success: false, 
          error: '2025 Excel file not found in Google Drive' 
        },
        { status: 404 }
      );
    }

    // Get file content
    const fileBuffer = await googleDrive.getFileContent(excelFiles.list2025.id);
    
    // Parse Excel to members
    const members = excelService.parseExcelToMembers(fileBuffer);

    return NextResponse.json({
      success: true,
      data: {
        fileInfo: excelFiles.list2025,
        members: members,
        count: members.length
      }
    });
  } catch (error) {
    console.error('Error reading 2025 Excel file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read 2025 Excel file' 
      },
      { status: 500 }
    );
  }
}
