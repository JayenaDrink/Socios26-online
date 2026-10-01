import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, SEASON_TABLES, Season } from '@/lib/supabase';
import { cleanMemberFields } from '@/lib/memberFields';
import { SeasonMemberFields } from '@/types';


// Update a member in a season table: { season: '2026' | '2027', id, fields }
export async function POST(request: NextRequest) {
  try {
    const { season = '2026', id, fields } = await request.json();

    if (!(season in SEASON_TABLES)) {
      return NextResponse.json({ success: false, error: 'Invalid season' }, { status: 400 });
    }
    if (!id || !fields) {
      return NextResponse.json({ success: false, error: 'id and fields are required' }, { status: 400 });
    }

    const clean = cleanMemberFields(fields);

    const database = getDatabaseService();
    const { member, mailchimp, updated2027 } = await database.updateSeasonMember(season as Season, Number(id), clean as Partial<SeasonMemberFields>);

    return NextResponse.json({ success: true, data: { member, mailchimp, updated2027 } });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
}
