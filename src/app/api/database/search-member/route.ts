import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';

// Search the 2026 list (socios_2627); each result says whether it is already in 2027
export async function POST(request: NextRequest) {
  try {
    const { member_number, email } = await request.json();

    if (!member_number && !email) {
      return NextResponse.json(
        { success: false, error: 'Either member_number or email is required' },
        { status: 400 }
      );
    }

    const database = getDatabaseService();
    const found = await database.searchSeason('2026', { member_number, email });
    const members = await database.markIn2027(found);

    return NextResponse.json({
      success: true,
      data: { searchCriteria: { member_number, email }, members, count: members.length }
    });
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to search members' },
      { status: 500 }
    );
  }
}
