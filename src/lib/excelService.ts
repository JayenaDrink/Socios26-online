import * as XLSX from 'xlsx';
import { Member } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ExcelService {
  // Parse Excel file buffer to array of members
  parseExcelToMembers(buffer: Buffer): Member[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        return [];
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      
      // Map headers to our member properties
      const headerMap = this.createHeaderMap(headers);
      
      // Debug logging
      console.log('Headers found:', headers);
      console.log('Header mapping:', headerMap);
      
      // Convert data rows to members
      const members: Member[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row && row.length > 0) {
          const member = this.rowToMember(row, headerMap);
          if (member) {
            members.push(member);
          } else if (i <= 3) { // Log first few failed rows for debugging
            console.log(`Failed to parse row ${i}:`, row);
            console.log('Header map:', headerMap);
          }
        }
      }

      return members;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Failed to parse Excel file');
    }
  }

  // Convert members array to Excel buffer
  membersToExcelBuffer(members: Member[]): Buffer {
    try {
      // Prepare data for Excel
      const excelData = members.map(member => ({
        'Lidnummer': member.member_number,
        'Voornaam': member.first_name,
        'Achternaam': member.last_name,
        'Email': member.email,
        'Telefoon': member.phone || '',
        'Bedrag Betaald': member.amount_paid,
        'Jaar': member.year,
        'Actief': member.is_active ? 'Ja' : 'Nee',
        'Bron': member.source,
        'Aangemaakt': member.created_at ? new Date(member.created_at).toLocaleDateString('nl-NL') : '',
        'Bijgewerkt': member.updated_at ? new Date(member.updated_at).toLocaleDateString('nl-NL') : ''
      }));

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leden 2026');

      // Convert to buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    } catch (error) {
      console.error('Error creating Excel file:', error);
      throw new Error('Failed to create Excel file');
    }
  }

  // Create header mapping for different Excel formats
  private createHeaderMap(headers: string[]): { [key: string]: number } {
    const map: { [key: string]: number } = {};
    
    headers.forEach((header, index) => {
      const normalizedHeader = header?.toLowerCase().trim();
      
      // Map specific patterns from your Excel file
      if (normalizedHeader === 'lid nr' || normalizedHeader?.includes('lidnummer') || normalizedHeader?.includes('member') || normalizedHeader?.includes('nummer')) {
        map.member_number = index;
      } else if (normalizedHeader === 'nombre' || normalizedHeader?.includes('voornaam') || normalizedHeader?.includes('first') || normalizedHeader?.includes('naam')) {
        map.first_name = index;
      } else if (normalizedHeader === 'apellido' || normalizedHeader?.includes('achternaam') || normalizedHeader?.includes('last') || normalizedHeader?.includes('familienaam')) {
        map.last_name = index;
      } else if (normalizedHeader === 'mail-adres' || normalizedHeader?.includes('mail') || normalizedHeader?.includes('email') || normalizedHeader?.includes('e-mail')) {
        map.email = index;
      } else if (normalizedHeader === 'telefoonnr.' || normalizedHeader?.includes('telefoon') || normalizedHeader?.includes('phone') || normalizedHeader?.includes('tel')) {
        map.phone = index;
      } else if (normalizedHeader === 'betaald' || normalizedHeader?.includes('bedrag') || normalizedHeader?.includes('amount') || normalizedHeader?.includes('paid')) {
        map.amount_paid = index;
      } else if (normalizedHeader === 'status' || normalizedHeader?.includes('jaar') || normalizedHeader?.includes('year')) {
        map.year = index;
      }
    });

    return map;
  }

  // Convert Excel row to Member object
  private rowToMember(row: any[], headerMap: { [key: string]: number }): Member | null {
    try {
      const member_number = this.getValue(row, headerMap.member_number);
      const first_name = this.getValue(row, headerMap.first_name);
      const last_name = this.getValue(row, headerMap.last_name);
      const email = this.getValue(row, headerMap.email);

      // Validate required fields
      if (!member_number || !first_name || !last_name || !email) {
        return null;
      }

      return {
        member_number: String(member_number).trim(),
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: this.getValue(row, headerMap.phone) ? String(this.getValue(row, headerMap.phone)).trim() : '',
        amount_paid: this.getValue(row, headerMap.amount_paid) ? Number(this.getValue(row, headerMap.amount_paid)) || 35 : 35,
        year: this.getValue(row, headerMap.year) ? Number(this.getValue(row, headerMap.year)) || 2025 : 2025,
        is_active: true,
        source: '2025_list' as const
      };
    } catch (error) {
      console.error('Error converting row to member:', error);
      return null;
    }
  }

  // Safely get value from row by index
  private getValue(row: any[], index: number | undefined): any {
    if (index === undefined || index < 0 || index >= row.length) {
      return null;
    }
    return row[index];
  }

  // Search members by criteria
  searchMembers(members: Member[], criteria: { member_number?: string; email?: string }): Member[] {
    return members.filter(member => {
      if (criteria.member_number && member.member_number.toLowerCase().includes(criteria.member_number.toLowerCase())) {
        return true;
      }
      if (criteria.email && member.email.toLowerCase().includes(criteria.email.toLowerCase())) {
        return true;
      }
      return false;
    });
  }
}

// Singleton instance
let excelService: ExcelService | null = null;

export function getExcelService(): ExcelService {
  if (!excelService) {
    excelService = new ExcelService();
  }
  return excelService;
}
