import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const database = getDatabaseService();
    const members = await database.getMembers2026();

    // Sort members by last_name as requested
    const sortedMembers = members.sort((a, b) => a.last_name.localeCompare(b.last_name));

    // Prepare data for export with only the requested fields
    const exportData = sortedMembers.map(member => ({
      member_number: member.member_number,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone,
      year: member.year
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members 2026');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `members_2026_${timestamp}.xlsx`;

    // Return Excel file as response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting 2026 members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to export 2026 members' 
      },
      { status: 500 }
    );
  }
}
