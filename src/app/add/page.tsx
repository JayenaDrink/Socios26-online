'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserLayout from '@/components/UserLayout';
import MemberFormFields, { EMPTY_MEMBER_FORM, MemberFormValues } from '@/components/MemberFormFields';

type Season = '2026' | '2027';

const today = () => new Date().toISOString().split('T')[0];
const freshForm = (): MemberFormValues => ({ ...EMPTY_MEMBER_FORM, registration_date: today() });

export default function AddMemberPage() {
  const { t, i18n } = useTranslation();
  const [lastAdded, setLastAdded] = useState<{ id: number; season: Season } | null>(null);
  const [season, setSeason] = useState<Season>('2026');
  const [values, setValues] = useState<MemberFormValues>(freshForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setLastAdded(null);

    try {
      // Member number is assigned by the database
      const { member_number: _ignored, ...fields } = values;
      void _ignored;
      const response = await fetch('/api/database/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, ...fields }),
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        const name = `${values.first_name} ${values.last_name}`.trim();
        const tag = season === '2026' ? 'Activos 25-26' : 'Activos 26-27';
        setSuccess(
          `${t('addMember.added')} ${season}: ${name} — ${t('memberForm.assignedNumber')}: ${data.member?.member_number ?? '?'}` +
          (data.mailchimp?.ok ? ` — MailChimp: ${tag} ✓` : '')
        );
        if (data.mailchimp && !data.mailchimp.ok && !data.mailchimp.skipped) setError(`MailChimp: ${data.mailchimp.error}`);
        if (data.member?.id) setLastAdded({ id: data.member.id, season });
        setValues(freshForm());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || 'Failed to add member');
      }
    } catch (err) {
      setError('Network error occurred while adding member');
      console.error('Add member error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('addMember.title')}</h1>
            <p className="text-gray-600">{t('addMember.description')}</p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
              <p className="text-green-700">{success}</p>
              {lastAdded && (() => {
                const base = `/api/database/member-pdf?season=${lastAdded.season}&id=${lastAdded.id}&lang=${(i18n.language || 'es').slice(0, 2)}`;
                return (
                  <div className="flex flex-wrap gap-3">
                    <a href={`${base}&download=1`} className="bg-green-600 text-white py-2 px-5 rounded-md hover:bg-green-700">
                      📄 {t('pdf.download')}
                    </a>
                    <a href={base} target="_blank" rel="noopener" className="bg-white border border-green-600 text-green-700 py-2 px-5 rounded-md hover:bg-green-50">
                      🖨️ {t('pdf.print')}
                    </a>
                  </div>
                );
              })()}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('addMember.targetDatabase')}</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026">{t('addMember.database2026')}</option>
                <option value="2027">{t('addMember.database2027')}</option>
              </select>
            </div>

            <MemberFormFields values={values} onChange={setValues} memberNumberMode="auto" />

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white py-3 px-8 rounded-md text-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('addMember.adding') : t('addMember.addButton')}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
