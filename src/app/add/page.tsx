'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserLayout from '@/components/UserLayout';

type Season = '2026' | '2027';

interface MemberFormData {
  season: Season;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const EMPTY = { member_number: '', first_name: '', last_name: '', email: '', phone: '' };

export default function AddMemberPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<MemberFormData>({ season: '2026', ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/database/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (data.success) {
        const name = `${formData.first_name} ${formData.last_name}`.trim();
        const tag = formData.season === '2026' ? 'Activos 25-26' : 'Activos 26-27';
        setSuccess(`${t('addMember.added')} ${formData.season}: ${name}` + (data.mailchimp?.ok ? ` — MailChimp: ${tag} ✓` : ''));
        if (data.mailchimp && !data.mailchimp.ok && !data.mailchimp.skipped) setError(`MailChimp: ${data.mailchimp.error}`);
        setFormData({ season: formData.season, ...EMPTY });
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

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('addMember.title')}</h1>
            <p className="text-gray-600">{t('addMember.description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target list */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.targetDatabase')}</label>
              <select name="season" value={formData.season} onChange={handleChange} className={inputClass} required>
                <option value="2026">{t('addMember.database2026')}</option>
                <option value="2027">{t('addMember.database2027')}</option>
              </select>
            </div>

            {/* Member number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.memberNumber')} *</label>
              <input
                type="text"
                name="member_number"
                value={formData.member_number}
                onChange={handleChange}
                className={inputClass}
                placeholder={t('addMember.memberNumberPlaceholder')}
                required
              />
            </div>

            {/* Names */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.firstName')} *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={t('addMember.firstNamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.lastName')} *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder={t('addMember.lastNamePlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder={t('addMember.emailPlaceholder')}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('addMember.phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder={t('addMember.phonePlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('addMember.adding') : t('addMember.addButton')}
            </button>
          </form>

          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
