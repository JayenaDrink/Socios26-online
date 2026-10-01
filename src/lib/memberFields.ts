import { MEMBER_FIELDS, MemberField } from '@/types';

type Clean = Partial<Record<MemberField, string | number | boolean | null>>;

// Turn form/API input into database values. Only keys present in `input` are returned.
// Empty strings become null; resident -> boolean; amount_paid -> number; dates -> YYYY-MM-DD.
export function cleanMemberFields(input: Record<string, unknown>): Clean {
  const out: Clean = {};
  for (const f of MEMBER_FIELDS) {
    if (!(f in input)) continue;
    const raw = input[f];
    const v = typeof raw === 'string' ? raw.trim() : raw;

    if (v === '' || v === undefined || v === null) {
      out[f] = null;
      continue;
    }

    switch (f) {
      case 'resident':
        out[f] = v === true || v === 'true' || v === 'yes' ? true : v === false || v === 'false' || v === 'no' ? false : null;
        break;
      case 'amount_paid': {
        const n = Number(String(v).replace(',', '.'));
        out[f] = Number.isFinite(n) ? n : null;
        break;
      }
      case 'birth_date':
      case 'registration_date':
        out[f] = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null;
        break;
      default:
        out[f] = String(v);
    }
  }
  return out;
}
