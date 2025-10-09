import { NextResponse } from 'next/server';
import { getDatabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const database = getDatabaseService();
    const status = await database.getStatus();

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check database status' 
      },
      { status: 500 }
    );
  }
}
