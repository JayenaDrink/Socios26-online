import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, SEASON_TABLES, Season } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// GET /api/database/export/2026 -> socios_2627
// GET /api/database/export/2027 -> members27
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ season: string }> }
) {
  const { season } = await params;

  if (!(season in SEASON_TABLES)) {
    return NextResponse.json(
      { success: false, error: `Unknown season ${season}` },
      { status: 404 }
    );
  }

  try {
    const database = getDatabaseService();
    const members = await database.getSeasonMembers(season as Season);

    const exportData = members.map(member => ({
      member_number: member.member_number,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = exportData.length
      ? XLSX.utils.json_to_sheet(exportData)
      : XLSX.utils.aoa_to_sheet([['member_number', 'first_name', 'last_name', 'email', 'phone']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, `Members ${season}`);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `members_${season}_${timestamp}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error(`Error exporting ${season} members:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : `Failed to export ${season} members`
      },
      { status: 500 }
    );
  }
}
