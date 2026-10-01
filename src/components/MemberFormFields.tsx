'use client';

import { useTranslation } from 'react-i18next';

// Form values are kept as strings; resident is '' | 'yes' | 'no'
export type MemberFormValues = Record<string, string>;

export const EMPTY_MEMBER_FORM: MemberFormValues = {
  member_number: '', first_name: '', last_name: '', spouse_companion: '', resident: '',
  nationality: '', birth_place: '', birth_date: '', address: '', phone: '', email: '',
  sos_contact_name: '', amount_paid: '', registration_date: '',
};

// Convert a database row to form values
export function memberToForm(member: Record<string, unknown>): MemberFormValues {
  const out: MemberFormValues = { ...EMPTY_MEMBER_FORM };
  for (const k of Object.keys(EMPTY_MEMBER_FORM)) {
    const v = member[k];
    if (k === 'resident') out[k] = v === true ? 'yes' : v === false ? 'no' : '';
    else out[k] = v === null || v === undefined ? '' : String(v);
  }
  return out;
}

interface Props {
  values: MemberFormValues;
  onChange: (values: MemberFormValues) => void;
  // 'auto': member number assigned by the database (new member); 'edit': editable field
  memberNumberMode: 'auto' | 'edit';
}

export default function MemberFormFields({ values, onChange, memberNumberMode }: Props) {
  const { t } = useTranslation();
  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...values, [name]: e.target.value });

  const input = 'w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'block text-sm font-medium text-gray-700 mb-1';
  const section = 'text-sm font-semibold uppercase tracking-wide text-gray-500 border-b pb-1 mb-3';

  const field = (name: string, text: string, type = 'text', required = false) => (
    <div>
      <label className={label}>{text}{required ? ' *' : ''}</label>
      <input type={type} name={name} value={values[name] ?? ''} onChange={set(name)} className={input} required={required} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Personal data */}
      <div>
        <h3 className={section}>{t('memberForm.sectionPersonal')}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {field('first_name', t('memberForm.firstName'), 'text', true)}
          {field('last_name', t('memberForm.lastName'), 'text', true)}
          <div className="md:col-span-2">{field('spouse_companion', t('memberForm.spouseCompanion'))}</div>
          <div>
            <label className={label}>{t('memberForm.resident')}</label>
            <select name="resident" value={values.resident ?? ''} onChange={set('resident')} className={input}>
              <option value="">—</option>
              <option value="yes">{t('memberForm.yes')}</option>
              <option value="no">{t('memberForm.no')}</option>
            </select>
          </div>
          {field('nationality', t('memberForm.nationality'))}
          {field('birth_place', t('memberForm.birthPlace'))}
          {field('birth_date', t('memberForm.birthDate'), 'date')}
        </div>
      </div>

      {/* Contact */}
      <div>
        <h3 className={section}>{t('memberForm.sectionContact')}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">{field('address', t('memberForm.address'))}</div>
          {field('phone', t('memberForm.phone'), 'tel')}
          {field('email', t('memberForm.email'), 'email')}
          <div className="md:col-span-2">{field('sos_contact_name', t('memberForm.sosContact'))}</div>
        </div>
      </div>

      {/* Membership */}
      <div>
        <h3 className={section}>{t('memberForm.sectionMembership')}</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={label}>{t('memberForm.amountPaid')}</label>
            <input type="number" inputMode="decimal" step="0.01" min="0" name="amount_paid"
              value={values.amount_paid ?? ''} onChange={set('amount_paid')} className={input} />
          </div>
          {field('registration_date', t('memberForm.registrationDate'), 'date')}
          <div>
            <label className={label}>{t('memberForm.memberNumber')}</label>
            {memberNumberMode === 'auto' ? (
              <div className="w-full border border-dashed border-gray-300 rounded-md px-3 py-2 text-gray-500 bg-gray-50">
                {t('memberForm.memberNumberAuto')}
              </div>
            ) : (
              <input type="text" name="member_number" value={values.member_number ?? ''} onChange={set('member_number')} className={input} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
