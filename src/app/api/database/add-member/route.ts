import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService, SEASON_TABLES, Season } from '@/lib/supabase';

// Add a new member to socios_2627 (season 2026, default) or members27 (season 2027)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const season: string = body.season || '2026';
    const t = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

    const fields = {
      member_number: t(body.member_number),
      first_name: t(body.first_name),
      last_name: t(body.last_name),
      email: t(body.email),
      phone: t(body.phone)
    };

    if (!(season in SEASON_TABLES)) {
      return NextResponse.json({ success: false, error: 'Invalid list selection' }, { status: 400 });
    }
    if (!fields.member_number || !fields.first_name || !fields.last_name) {
      return NextResponse.json(
        { success: false, error: 'Member number, first name and last name are required' },
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
