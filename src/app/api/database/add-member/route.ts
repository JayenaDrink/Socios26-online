import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, SEASON_TABLES, Season } from '@/lib/supabase';
import { cleanMemberFields } from '@/lib/memberFields';
import { SeasonMemberFields } from '@/types';

// Add a new member to socios_2627 (season 2026, default) or members27 (season 2027).
// The member number is assigned by the database (sequence from 9000) unless one is sent.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const season: string = body.season || '2026';

    if (!(season in SEASON_TABLES)) {
      return NextResponse.json({ success: false, error: 'Invalid list selection' }, { status: 400 });
    }

    const fields = cleanMemberFields(body) as SeasonMemberFields;
    if (!fields.first_name || !fields.last_name) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const database = getDatabaseService();
    const { member, mailchimp } = await database.addSeasonMember(season as Season, fields);

    return NextResponse.json({ success: true, member, mailchimp, message: `Member added to ${season} list` });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add member' },
      { status: 500 }
    );
  }
}
