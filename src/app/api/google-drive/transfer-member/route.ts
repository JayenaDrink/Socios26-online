import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveService } from '@/lib/googleDrive';
import { getExcelService } from '@/lib/excelService';
import { getDatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { member } = await request.json();

    if (!member || !member.member_number || !member.email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid member data provided' 
        },
        { status: 400 }
      );
    }

    const googleDrive = getGoogleDriveService();
    const excelService = getExcelService();
    const db = getDatabaseService();

    // Check if member already exists in database
    const existingMembers = await db.searchMembers2025({ 
      member_number: member.member_number 
    });

    if (existingMembers.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Member already exists in 2026 list' 
        },
        { status: 409 }
      );
    }

    // Transfer member to 2026
    const transferredMember = await db.transferMemberTo2026(member);

    // Update the 2026 Excel file in Google Drive
    await update2026ExcelFile(googleDrive, excelService, db);

    return NextResponse.json({
      success: true,
      data: {
        memberId: transferredMember.id,
        member: transferredMember,
        message: 'Member successfully transferred to 2026'
      }
    });
  } catch (error) {
    console.error('Error transferring member:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to transfer member' 
      },
      { status: 500 }
    );
  }
}

// Helper function to update 2026 Excel file
async function update2026ExcelFile(googleDrive: any, excelService: any, db: any) {
  try {
    // Get all 2026 members from database
    const members2026 = await db.getMembers2026();

    // Convert to Excel buffer
    const excelBuffer = excelService.membersToExcelBuffer(members2026);

    // Find the 2026 Excel file
    const excelFiles = await googleDrive.findExcelFiles();
    
    if (excelFiles.list2026) {
      // Update existing file
      await googleDrive.updateFileContent(excelFiles.list2026.id, excelBuffer);
    } else {
      // Create new file
      const fileName = 'Lista Socios Club Amistades Belgas 2026.xlsx';
      await googleDrive.createFile(fileName, excelBuffer);
    }
  } catch (error) {
    console.error('Error updating 2026 Excel file:', error);
    throw error;
  }
}
