import { createClient } from '@supabase/supabase-js';
import { Member } from '@/types';
import { getMailChimpService } from './mailchimp';

// Online version - Only use Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseService {
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

  // Get database status
  async getStatus(): Promise<{ connected: boolean; tables: { members_2025: number; members_2026: number }; error?: string }> {
    try {
      const [members2025, members2026] = await Promise.all([
        this.getMembers2025(),
        this.getMembers2026()
      ]);

      return {
        connected: true,
        tables: {
          members_2025: members2025.length,
          members_2026: members2026.length
        }
      };
    } catch (error) {
      return {
        connected: false,
        tables: { members_2025: 0, members_2026: 0 },
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