import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const database = getDatabaseService();
    const members = await database.getMembers2026();

    return NextResponse.json({
      success: true,
      data: {
        members: members,
        count: members.length
      }
    });
  } catch (error) {
    console.error('Error fetching 2026 members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch 2026 members' 
      },
      { status: 500 }
    );
  }
}
