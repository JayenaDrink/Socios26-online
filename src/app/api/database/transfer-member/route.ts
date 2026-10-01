import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';

// Migrate a member from socios_2627 to members27 by id
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member id is required' }, { status: 400 });
    }

    const database = getDatabaseService();
    const { member, mailchimp } = await database.migrateTo2027(Number(id));

    return NextResponse.json({ success: true, data: { member, mailchimp, message: 'Member migrated to 2027' } });
  } catch (error) {
    console.error('Error migrating member:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to migrate member' },
      { status: 500 }
    );
  }
}
