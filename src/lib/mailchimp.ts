import Mailchimp from 'mailchimp-api-v3';
import { createHash } from 'crypto';
import { Member, MailChimpSync, MAILCHIMP_TAG, SeasonMemberFields, MailchimpResult } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MailChimpService {
  private mailchimp: Mailchimp;
  private audienceId: string;
  private isConfigured: boolean;

  constructor() {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
    this.audienceId = process.env.MAILCHIMP_AUDIENCE_ID || '';

    if (!apiKey || !serverPrefix || !this.audienceId) {
      this.isConfigured = false;
      console.log('MailChimp not configured - running in local mode without MailChimp integration');
      // Create a dummy mailchimp instance to prevent errors
      this.mailchimp = {} as Mailchimp;
      return;
    }

    this.isConfigured = true;
    this.mailchimp = new Mailchimp(apiKey);
  }

  // Add member to MailChimp audience
  async addMemberToAudience(member: Member): Promise<MailChimpSync> {
    if (!this.isConfigured) {
      console.log(`MailChimp not configured - simulating sync for member ${member.member_number}`);
      return {
        member_id: member.id!,
        mailchimp_id: `local-${member.id}`,
        audience_id: 'local',
        tags: [MAILCHIMP_TAG],
        synced_at: new Date().toISOString()
      };
    }

    try {
      // Check if member already exists in audience
      const existingMember = await this.findMemberByEmail(member.email);
      
      if (existingMember) {
        // Update existing member with new tags
        await this.updateMemberTags(existingMember.id, [MAILCHIMP_TAG]);
        return {
          member_id: member.id!,
          mailchimp_id: existingMember.id,
          audience_id: this.audienceId,
          tags: [MAILCHIMP_TAG],
          synced_at: new Date().toISOString()
        };
      }

      // Create new member
      const memberData = {
        email_address: member.email,
        status: 'subscribed',
        merge_fields: {
          FNAME: member.first_name,
          LNAME: member.last_name,
          PHONE: member.phone || '',
          MEMBER_NUM: member.member_number,
          AMOUNT_PAID: member.amount_paid?.toString() || '35'
        },
        tags: [MAILCHIMP_TAG]
      };

      const response = await this.mailchimp.post(`/lists/${this.audienceId}/members`, memberData);

      return {
        member_id: member.id!,
        mailchimp_id: response.id,
        audience_id: this.audienceId,
        tags: [MAILCHIMP_TAG],
        synced_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error adding member to MailChimp:', error);
      throw new Error(`Failed to add member to MailChimp: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Find member by email in audience
  private async findMemberByEmail(email: string): Promise<any> {
    if (!this.isConfigured) {
      return null; // In local mode, always return null (member not found)
    }

    try {
      const response = await this.mailchimp.get(`/lists/${this.audienceId}/members/${this.getSubscriberHash(email)}`);
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // Member not found
      }
      throw error;
    }
  }

  // Update member tags
  private async updateMemberTags(memberId: string, tags: string[]): Promise<any> {
    if (!this.isConfigured) {
      console.log(`MailChimp not configured - simulating tag update for member ${memberId}`);
      return { success: true };
    }

    try {
      const response = await this.mailchimp.post(`/lists/${this.audienceId}/members/${memberId}/tags`, {
        tags: tags.map(tag => ({ name: tag, status: 'active' }))
      });
      return response;
    } catch (error) {
      console.error('Error updating member tags:', error);
      throw error;
    }
  }

  // Create or update a contact and set its tags.
  // addTags become active, removeTags become inactive. Never throws: returns { ok, error }.
  async syncContact(member: SeasonMemberFields, addTags: string[], removeTags: string[] = []): Promise<MailchimpResult> {
    const email = (member.email || '').trim();
    if (!this.isConfigured) return { ok: false, skipped: true, error: 'MailChimp not configured' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || /^(sin@correo\.com|nocorreo@gmail\.com)$/i.test(email)) {
      return { ok: false, skipped: true, error: 'No valid email, contact not sent to MailChimp' };
    }

    const hash = this.getSubscriberHash(email);
    const path = `/lists/${this.audienceId}/members/${hash}`;
    const mergeFields: Record<string, string> = {};
    if (member.first_name) mergeFields.FNAME = member.first_name;
    if (member.last_name) mergeFields.LNAME = member.last_name;

    const describe = (error: unknown) => {
      const e = error as { status?: number; title?: string; detail?: string; message?: string };
      const msg = e?.detail || e?.title || e?.message || 'Unknown MailChimp error';
      return e?.status ? `${e.status} - ${msg}` : msg;
    };

    try {
      // Upsert: keeps existing subscription status, subscribes new contacts
      try {
        await this.mailchimp.put(path, {
          email_address: email,
          status_if_new: 'subscribed',
          merge_fields: member.phone ? { ...mergeFields, PHONE: member.phone } : mergeFields
        });
      } catch (error) {
        // Retry without the phone in case the audience rejects its format
        if (!member.phone) throw error;
        console.warn('MailChimp rejected contact with phone, retrying without it:', describe(error));
        await this.mailchimp.put(path, { email_address: email, status_if_new: 'subscribed', merge_fields: mergeFields });
      }

      const tags = [
        ...addTags.map(name => ({ name, status: 'active' })),
        ...removeTags.map(name => ({ name, status: 'inactive' }))
      ];
      if (tags.length) await this.mailchimp.post(`${path}/tags`, { tags });

      return { ok: true };
    } catch (error) {
      const msg = describe(error);
      console.error(`MailChimp sync failed for ${email}:`, msg);
      return { ok: false, error: msg };
    }
  }

  // Apply an edit to an existing contact.
  // If the email changed, the contact keeps its history and tags under the new email.
  // If the contact does not exist in Mailchimp yet, it is created with fallbackTags.
  async updateContact(
    oldEmail: string | null,
    updated: SeasonMemberFields,
    fallbackAdd: string[],
    fallbackRemove: string[] = []
  ): Promise<MailchimpResult> {
    if (!this.isConfigured) return { ok: false, skipped: true, error: 'MailChimp not configured' };

    const validEmail = (e: string | null | undefined) =>
      !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()) && !/^(sin@correo\.com|nocorreo@gmail\.com)$/i.test(e.trim());
    const newEmail = (updated.email || '').trim();
    const prevEmail = (oldEmail || '').trim();

    if (!validEmail(newEmail)) return { ok: false, skipped: true, error: 'No valid email, contact not sent to MailChimp' };

    const mergeFields: Record<string, string> = {};
    if (updated.first_name) mergeFields.FNAME = updated.first_name;
    if (updated.last_name) mergeFields.LNAME = updated.last_name;
    if (updated.phone) mergeFields.PHONE = updated.phone;

    const describe = (error: unknown) => {
      const e = error as { status?: number; title?: string; detail?: string; message?: string };
      const msg = e?.detail || e?.title || e?.message || 'Unknown MailChimp error';
      return e?.status ? `${e.status} - ${msg}` : msg;
    };
    const statusOf = (error: unknown) => (error as { status?: number })?.status;

    // Patch the contact found under `email`; returns false if it does not exist
    const patch = async (email: string, body: Record<string, unknown>) => {
      try {
        await this.mailchimp.patch(`/lists/${this.audienceId}/members/${this.getSubscriberHash(email)}`, body);
        return true;
      } catch (error) {
        if (statusOf(error) === 404) return false;
        // Retry without phone if its format is rejected
        if (body.merge_fields && (body.merge_fields as Record<string, string>).PHONE) {
          const { PHONE: _phone, ...rest } = body.merge_fields as Record<string, string>;
          void _phone;
          await this.mailchimp.patch(`/lists/${this.audienceId}/members/${this.getSubscriberHash(email)}`, { ...body, merge_fields: rest });
          return true;
        }
        throw error;
      }
    };

    try {
      const emailChanged = validEmail(prevEmail) && prevEmail.toLowerCase() !== newEmail.toLowerCase();

      if (emailChanged) {
        // Move the existing contact to the new email (keeps tags and history)
        if (await patch(prevEmail, { email_address: newEmail, merge_fields: mergeFields })) return { ok: true };
      } else {
        if (await patch(newEmail, { merge_fields: mergeFields })) return { ok: true };
      }

      // Not in Mailchimp under the old/current email: create it with the season tags
      return await this.syncContact(updated, fallbackAdd, fallbackRemove);
    } catch (error) {
      const msg = describe(error);
      console.error(`MailChimp update failed for ${prevEmail || newEmail}:`, msg);
      return { ok: false, error: msg };
    }
  }

  // Get subscriber hash for email (required by MailChimp API)
  private getSubscriberHash(email: string): string {
    return createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  // Test MailChimp connection
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { 
        connected: true,
        error: 'MailChimp not configured - running in local mode'
      };
    }

    try {
      await this.mailchimp.get(`/lists/${this.audienceId}`);
      return { connected: true };
    } catch (error) {
      // mailchimp-api-v3 rejects with a plain object ({ status, title, detail }), not an Error
      const e = error as { status?: number; title?: string; detail?: string; message?: string };
      const msg = e?.detail || e?.title || e?.message || 'Failed to connect to MailChimp';
      return {
        connected: false,
        error: e?.status ? `${e.status} - ${msg}` : msg
      };
    }
  }

  // Get audience information
  async getAudienceInfo(): Promise<any> {
    if (!this.isConfigured) {
      return {
        name: 'Local Development Mode',
        member_count: 0,
        id: 'local',
        status: 'MailChimp not configured'
      };
    }

    try {
      const response = await this.mailchimp.get(`/lists/${this.audienceId}`);
      return {
        name: response.name,
        member_count: response.stats.member_count,
        id: response.id
      };
    } catch (error) {
      console.error('Error getting audience info:', error);
      throw error;
    }
  }
}

// Singleton instance
let mailchimpService: MailChimpService | null = null;

export function getMailChimpService(): MailChimpService | null {
  if (!mailchimpService) {
    try {
      mailchimpService = new MailChimpService();
    } catch (error) {
      console.error('Failed to initialize MailChimp service:', error);
      return null;
    }
  }
  return mailchimpService;
}
