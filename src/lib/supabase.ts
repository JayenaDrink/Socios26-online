import { createClient } from '@supabase/supabase-js';
import { Member, SeasonMember, SeasonMemberFields, SEASON_TAGS, MailchimpResult, MEMBER_FIELDS } from '@/types';
import { getMailChimpService } from './mailchimp';

// Server-only Supabase client. This file must only be imported from API routes.
// Preferred: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (secret, never sent to the browser).
// The NEXT_PUBLIC_* names are still accepted as a fallback for older local setups.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Season tables: 2026 = socios 2026-27 (loaded list), 2027 = renewals (members27)
export const SEASON_TABLES = {
  '2026': 'socios_2627',
  '2027': 'members27',
} as const;
export type Season = keyof typeof SEASON_TABLES;

// Send a member to Mailchimp with the tag of its season list.
// 2026 -> "Activos 25-26"; 2027 -> "Activos 26-27" and removes "Activos 25-26".
async function syncSeasonTags(season: Season, fields: SeasonMemberFields): Promise<MailchimpResult> {
  const mailchimp = getMailChimpService();
  if (!mailchimp) return { ok: false, skipped: true, error: 'MailChimp not configured' };
  const add = [SEASON_TAGS[season]];
  const remove = season === '2027' ? [SEASON_TAGS['2026']] : [];
  return mailchimp.syncContact(fields, add, remove);
}

export class DatabaseService {
  // Get all rows from a season table
  async getSeasonMembers(season: Season): Promise<Member[]> {
    const table = SEASON_TABLES[season];
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('last_name', { nullsFirst: false });

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    return data || [];
  }

  // Search a season table: exact member number and/or partial email
  async searchSeason(season: Season, criteria: { member_number?: string; email?: string }): Promise<SeasonMember[]> {
    let query = supabase.from(SEASON_TABLES[season]).select('*');
    if (criteria.member_number) query = query.eq('member_number', criteria.member_number.trim());
    if (criteria.email) query = query.ilike('email', `%${criteria.email.trim()}%`);
    const { data, error } = await query.order('last_name', { nullsFirst: false });
    if (error) throw new Error(`Failed to search ${SEASON_TABLES[season]}: ${error.message}`);
    return (data || []) as SeasonMember[];
  }

  // Find a row in members27 that matches this member (same number + same email)
  async findIn2027(member: SeasonMemberFields): Promise<SeasonMember | null> {
    let query = supabase.from(SEASON_TABLES['2027']).select('*');
    query = member.member_number ? query.eq('member_number', member.member_number) : query.is('member_number', null);
    query = member.email ? query.ilike('email', member.email) : query.is('email', null);
    const { data, error } = await query.limit(1);
    if (error) throw new Error(`Failed to check members27: ${error.message}`);
    return data && data.length ? (data[0] as SeasonMember) : null;
  }

  // Mark which search results already exist in members27
  async markIn2027(members: SeasonMember[]): Promise<SeasonMember[]> {
    const numbers = members.map(m => m.member_number).filter((n): n is string => !!n);
    if (!numbers.length) return members.map(m => ({ ...m, in_2027: false }));
    const { data, error } = await supabase
      .from(SEASON_TABLES['2027'])
      .select('member_number, email')
      .in('member_number', numbers);
    if (error) throw new Error(`Failed to check members27: ${error.message}`);
    const keys = new Set((data || []).map(r => `${r.member_number}|${(r.email || '').toLowerCase()}`));
    return members.map(m => ({ ...m, in_2027: keys.has(`${m.member_number}|${(m.email || '').toLowerCase()}`) }));
  }

  // Copy a member from socios_2627 to members27
  async migrateTo2027(id: number): Promise<{ member: SeasonMember; mailchimp: MailchimpResult }> {
    const { data: source, error: srcError } = await supabase
      .from(SEASON_TABLES['2026']).select('*').eq('id', id).single();
    if (srcError || !source) throw new Error('Member not found in 2026 list');

    // Copy every data column (keeps the member number)
    const fields = Object.fromEntries(
      MEMBER_FIELDS.map(f => [f, source[f] ?? null])
    ) as SeasonMemberFields;

    if (await this.findIn2027(fields)) throw new Error('Member already exists in 2027 list');

    const { data, error } = await supabase
      .from(SEASON_TABLES['2027']).insert([fields]).select().single();
    if (error) throw new Error(`Failed to migrate member: ${error.message}`);

    // Mailchimp: add the 2027 tag and drop the 2026 tag
    const mailchimp = await syncSeasonTags('2027', fields);
    return { member: data as SeasonMember, mailchimp };
  }

  // Update any field of a row in a season table
  async updateSeasonMember(
    season: Season,
    id: number,
    fields: Partial<SeasonMemberFields>
  ): Promise<{ member: SeasonMember; mailchimp: MailchimpResult; updated2027: boolean }> {
    const table = SEASON_TABLES[season];

    // Current values, needed to find the Mailchimp contact and the 2027 copy
    const { data: before, error: readError } = await supabase.from(table).select('*').eq('id', id).single();
    if (readError || !before) throw new Error('Member not found');

    const { data, error } = await supabase.from(table).update(fields).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update member: ${error.message}`);
    const member = data as SeasonMember;

    // Keep the 2027 copy (same number + old email) in step with edits made on the 2026 list
    let updated2027 = false;
    let in2027 = season === '2027';
    if (season === '2026') {
      const copy = await this.findIn2027(before as SeasonMemberFields);
      if (copy) {
        in2027 = true;
        const { error: copyError } = await supabase.from(SEASON_TABLES['2027']).update(fields).eq('id', copy.id);
        if (copyError) console.error('Failed to update 2027 copy:', copyError.message);
        else updated2027 = true;
      }
    }

    // Mailchimp: follow the email change / update names; create with the right tag if missing
    const mc = getMailChimpService();
    const mailchimp: MailchimpResult = mc
      ? await mc.updateContact(
          before.email,
          member,
          [SEASON_TAGS[in2027 ? '2027' : '2026']],
          in2027 ? [SEASON_TAGS['2026']] : []
        )
      : { ok: false, skipped: true, error: 'MailChimp not configured' };

    return { member, mailchimp, updated2027 };
  }

  // Add a new member to a season table (rejects a member number already in that table)
  async addSeasonMember(season: Season, fields: SeasonMemberFields): Promise<{ member: SeasonMember; mailchimp: MailchimpResult }> {
    const table = SEASON_TABLES[season];
    // No member number given: the database assigns the next one (sequence from 9000)
    if (!fields.member_number) delete (fields as Partial<SeasonMemberFields>).member_number;
    if (fields.member_number) {
      const { data: existing, error: exError } = await supabase
        .from(table).select('id').eq('member_number', fields.member_number).limit(1);
      if (exError) throw new Error(`Failed to check ${table}: ${exError.message}`);
      if (existing && existing.length) throw new Error(`Member number ${fields.member_number} already exists in ${season} list`);
    }
    const { data, error } = await supabase.from(table).insert([fields]).select().single();
    if (error) throw new Error(`Failed to add member: ${error.message}`);

    // Mailchimp: tag with the season tag (a 2027 member also loses the 2026 tag)
    const mailchimp = await syncSeasonTags(season, fields);
    return { member: data as SeasonMember, mailchimp };
  }

  // One row of a season table by id
  async getSeasonMemberById(season: Season, id: number): Promise<SeasonMember | null> {
    const { data, error } = await supabase.from(SEASON_TABLES[season]).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to read member: ${error.message}`);
    return (data as SeasonMember) || null;
  }

  // Count rows in a season table
  async countSeasonMembers(season: Season): Promise<number> {
    const table = SEASON_TABLES[season];
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error counting ${table}:`, error);
      throw new Error(`Failed to count ${table}: ${error.message}`);
    }

    return count || 0;
  }

  // Get all members from 2025 table
  async getMembers2025(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members_2025')
      .select('*')
      .order('member_number');

    if (error) {
      console.error('Error fetching 2025 members:', error);
      throw new Error('Failed to fetch 2025 members');
    }

    return data || [];
  }

  // Get all members from 2026 table
  async getMembers2026(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members_2026')
      .select('*')
      .order('member_number');

    if (error) {
      console.error('Error fetching 2026 members:', error);
      throw new Error('Failed to fetch 2026 members');
    }

    return data || [];
  }

  // Search members in 2025 table
  async searchMembers2025(criteria: { member_number?: string; email?: string }): Promise<Member[]> {
    let query = supabase.from('members_2025').select('*');

    if (criteria.member_number) {
      // Exact match for member number
      query = query.eq('member_number', criteria.member_number);
    }
    
    if (criteria.email) {
      // Partial match for email (case-insensitive)
      query = query.ilike('email', `%${criteria.email}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching 2025 members:', error);
      throw new Error('Failed to search 2025 members');
    }

    return data || [];
  }

  // Transfer member from 2025 to 2026
  async transferMemberTo2026(member: Member): Promise<Member> {
    // Check if member already exists in 2026 (only by member number)
    const { data: existingMember } = await supabase
      .from('members_2026')
      .select('*')
      .eq('member_number', member.member_number)
      .single();

    if (existingMember) {
      throw new Error('Member already exists in 2026 list');
    }

    // Prepare member data for 2026
    const member2026 = {
      ...member,
      year: 2026,
      is_active: true,
      source: '2025_list' as const,
      amount_paid: member.amount_paid || 35
    };

    // Insert into 2026 table
    const { data, error } = await supabase
      .from('members_2026')
      .insert([member2026])
      .select()
      .single();

    if (error) {
      console.error('Error transferring member to 2026:', error);
      throw new Error('Failed to transfer member to 2026');
    }

    // Add to MailChimp if configured
    try {
      const mailchimp = getMailChimpService();
      if (mailchimp) {
        const mailchimpSync = await mailchimp.addMemberToAudience(data);
        
        // Store MailChimp sync info in database
        await supabase
          .from('mailchimp_sync')
          .insert([mailchimpSync]);
        
        console.log(`Member ${data.member_number} added to MailChimp audience`);
      }
    } catch (mailchimpError) {
      console.error('MailChimp sync failed, but member was transferred:', mailchimpError);
      // Don't fail the transfer if MailChimp fails
    }

    return data;
  }

  // Add new member to 2025 table
  async addMemberTo2025(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members_2025')
      .insert([member])
      .select()
      .single();

    if (error) {
      console.error('Error adding member to 2025:', error);
      throw new Error('Failed to add member to 2025');
    }

    return data;
  }

  // Add new member to 2026 table
  async addMemberTo2026(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members_2026')
      .insert([member])
      .select()
      .single();

    if (error) {
      console.error('Error adding member to 2026:', error);
      throw new Error('Failed to add member to 2026');
    }

    // Add to MailChimp if configured
    try {
      const mailchimp = getMailChimpService();
      if (mailchimp) {
        const mailchimpSync = await mailchimp.addMemberToAudience(data);
        
        // Store MailChimp sync info in database
        await supabase
          .from('mailchimp_sync')
          .insert([mailchimpSync]);
        
        console.log(`Member ${data.member_number} added to MailChimp audience`);
      }
    } catch (mailchimpError) {
      console.error('MailChimp sync failed, but member was added:', mailchimpError);
      // Don't fail the add if MailChimp fails
    }

    return data;
  }

  // Import members from Excel data to 2025 table
  async importMembersTo2025(members: Member[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let successCount = 0;

    for (const member of members) {
      try {
        // Check if member already exists (only by member number)
        const { data: existingMember } = await supabase
          .from('members_2025')
          .select('id')
          .eq('member_number', member.member_number)
          .single();

        if (existingMember) {
          errors.push(`Member ${member.member_number} already exists`);
          continue;
        }

        // Insert member
        const { error } = await supabase
          .from('members_2025')
          .insert([{
            ...member,
            year: 2025,
            is_active: true,
            source: '2025_list'
          }]);

        if (error) {
          errors.push(`Failed to import ${member.member_number}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push(`Error importing ${member.member_number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: successCount, errors };
  }

  // Get database status (season tables 2026 and 2027)
  async getStatus(): Promise<{ connected: boolean; tables: { members_2026: number; members_2027: number }; error?: string }> {
    try {
      const [members2026, members2027] = await Promise.all([
        this.countSeasonMembers('2026'),
        this.countSeasonMembers('2027')
      ]);

      return {
        connected: true,
        tables: {
          members_2026: members2026,
          members_2027: members2027
        }
      };
    } catch (error) {
      return {
        connected: false,
        tables: { members_2026: 0, members_2027: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export supabase client
export { supabase };

// Singleton instance
let databaseService: DatabaseService | null = null;

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}