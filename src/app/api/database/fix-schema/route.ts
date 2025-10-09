import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Remove unique constraint from email columns
    const queries = [
      // Drop unique constraint from members_2025 email
      `ALTER TABLE members_2025 DROP CONSTRAINT IF EXISTS members_2025_email_key;`,
      
      // Drop unique constraint from members_2026 email  
      `ALTER TABLE members_2026 DROP CONSTRAINT IF EXISTS members_2026_email_key;`,
      
      // Keep member_number unique (this is what you want)
      // No changes needed for member_number constraints
    ];

    const results = [];
    for (const query of queries) {
      const { data, error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`Query result: ${query}`, { data, error });
        results.push({ query, success: false, error: error.message });
      } else {
        results.push({ query, success: true, data });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema updated to allow duplicate emails',
      results: results
    });
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update schema' 
      },
      { status: 500 }
    );
  }
}
