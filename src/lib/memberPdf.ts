import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';

// Labels come from locales/<lang>.json: memberForm.* plus pdf.*
export interface PdfLabels {
  memberForm: Record<string, string>;
  pdf: Record<string, string>;
}

export interface PdfMember {
  member_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  spouse_companion?: string | null;
  resident?: boolean | null;
  nationality?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  sos_contact_name?: string | null;
  amount_paid?: number | string | null;
  registration_date?: string | null;
}

// Letters that do not decompose with NFKD
const FALLBACK: Record<string, string> = {
  'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ø': 'o', 'Ø': 'O', 'ı': 'i', 'ħ': 'h', 'ŀ': 'l',
  '“': '"', '”': '"', '‘': "'", '’': "'", '–': '-', '—': '-',
};

// Standard PDF fonts only cover Western European characters: replace anything else
function safeText(font: PDFFont, input: string): string {
  const text = Array.from(input).map(ch => FALLBACK[ch] ?? ch).join('');
  try {
    font.encodeText(text);
    return text;
  } catch {
    return Array.from(text)
      .map(ch => {
        try { font.encodeText(ch); return ch; } catch {
          const plain = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '');
          try { font.encodeText(plain); return plain; } catch { return '?'; }
        }
      })
      .join('');
  }
}

// YYYY-MM-DD -> DD/MM/YYYY
function formatDate(v?: string | null): string {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
}

export async function buildMemberPdf(member: PdfMember, labels: PdfLabels, listName: string): Promise<Uint8Array> {
  const L = labels.memberForm;
  const P = labels.pdf;

  const doc = await PDFDocument.create();
  doc.setTitle(`${P.title} ${member.member_number ?? ''}`.trim());
  doc.setAuthor('Amistades Belgas de Levante');

  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.45, 0.45, 0.45);
  const line = rgb(0.6, 0.6, 0.6);

  const left = 56;
  const right = 595.28 - 56;
  let y = 841.89 - 64;

  const text = (s: string, x: number, yy: number, size: number, font = regular, color = ink) =>
    page.drawText(safeText(font, s), { x, y: yy, size, font, color });

  // Header
  text('AMISTADES BELGAS DE LEVANTE', left, y, 18, bold);
  const numLabel = `${L.memberNumber}: ${member.member_number ?? ''}`;
  const numWidth = bold.widthOfTextAtSize(safeText(bold, numLabel), 13);
  text(numLabel, right - numWidth, y + 2, 13, bold);
  y -= 22;
  text(`${P.title} — ${listName}`, left, y, 12, regular, grey);
  y -= 14;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1.2, color: ink });
  y -= 30;

  // One labelled row: label on the left, value on an underline
  const labelWidth = 170;
  const row = (label: string, value: string, x0 = left, x1 = right, lw = labelWidth) => {
    // Shrink long labels so they never run into the value
    const lbl = safeText(bold, `${label}:`);
    let ls = 10.5;
    while (ls > 7 && bold.widthOfTextAtSize(lbl, ls) > lw - 6) ls -= 0.5;
    page.drawText(lbl, { x: x0, y, size: ls, font: bold, color: ink });
    const vx = x0 + lw;
    const size = 11.5;
    let v = safeText(regular, value || '');
    while (v.length > 1 && regular.widthOfTextAtSize(v, size) > x1 - vx - 4) v = v.slice(0, -1);
    page.drawText(v, { x: vx + 2, y, size, font: regular, color: ink });
    page.drawLine({ start: { x: vx, y: y - 4 }, end: { x: x1, y: y - 4 }, thickness: 0.6, color: line });
  };
  const gap = () => { y -= 30; };
  const section = (title: string) => {
    y -= 6;
    text(title.toUpperCase(), left, y, 9.5, bold, grey);
    y -= 22;
  };

  const resident = member.resident === true ? L.yes : member.resident === false ? L.no : '';
  const amount = member.amount_paid === null || member.amount_paid === undefined || member.amount_paid === ''
    ? '' : `${Number(member.amount_paid).toFixed(2)} €`;
  const mid = left + (right - left) / 2;

  section(L.sectionPersonal);
  row(L.firstName, member.first_name ?? ''); gap();
  row(L.lastName, member.last_name ?? ''); gap();
  row(L.spouseCompanion, member.spouse_companion ?? ''); gap();
  row(L.resident, resident, left, mid - 12, 100);
  row(L.nationality, member.nationality ?? '', mid + 12, right, 85); gap();
  row(L.birthPlace, member.birth_place ?? '', left, mid - 12, 100);
  row(L.birthDate, formatDate(member.birth_date), mid + 12, right, 85); gap();

  section(L.sectionContact);
  row(L.address, member.address ?? ''); gap();
  row(L.phone, member.phone ?? ''); gap();
  row(L.email, member.email ?? ''); gap();
  row(L.sosContact, member.sos_contact_name ?? ''); gap();

  section(L.sectionMembership);
  row(L.amountPaid, amount, left, mid - 12, 100);
  row(L.registrationDate, formatDate(member.registration_date), mid + 12, right, 85); gap();
  row(L.memberNumber, member.member_number ?? '', left, mid - 12, 100); gap();

  // Signature
  y -= 30;
  text(`${P.signature}:`, left, y, 10.5, bold);
  page.drawLine({ start: { x: left + labelWidth, y: y - 4 }, end: { x: right, y: y - 4 }, thickness: 0.6, color: line });

  // Footer
  const footer = `${P.generated}: ${formatDate(new Date().toISOString())}`;
  text(footer, left, 40, 8.5, regular, grey);

  return doc.save();
}
