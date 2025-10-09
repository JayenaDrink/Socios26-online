import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const database = getDatabaseService();
    const members = await database.getMembers2025();

    return NextResponse.json({
      success: true,
      data: {
        members: members,
        count: members.length
      }
    });
  } catch (error) {
    console.error('Error fetching 2025 members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch 2025 members' 
      },
      { status: 500 }
    );
  }
}
