'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SeasonMember, SeasonMemberFields } from '@/types';

interface SearchResults {
  searchCriteria: { member_number?: string; email?: string };
  members: SeasonMember[];
  count: number;
}

const EDIT_FIELDS: (keyof SeasonMemberFields)[] = ['member_number', 'first_name', 'last_name', 'email', 'phone'];

export default function MemberSearch() {
  const { t } = useTranslation();
  const [searchCriteria, setSearchCriteria] = useState({ member_number: '', email: '' });
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SeasonMemberFields>({
    member_number: '', first_name: '', last_name: '', email: '', phone: ''
  });

  const fieldLabel = (f: keyof SeasonMemberFields) => ({
    member_number: t('addMember.memberNumber'),
    first_name: t('addMember.firstName'),
    last_name: t('addMember.lastName'),
    email: t('addMember.email'),
    phone: t('addMember.phone')
  })[f];

  const replaceMember = (updated: SeasonMember) => {
    if (!searchResults) return;
    setSearchResults({
      ...searchResults,
      members: searchResults.members.map(m => (m.id === updated.id ? { ...m, ...updated } : m))
    });
  };

  const handleSearch = async () => {
    if (!searchCriteria.member_number && !searchCriteria.email) {
      setError('Please enter either member number or email');
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    setEditingId(null);
    setSearchResults(null);
    try {
      const response = await fetch('/api/database/search-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchCriteria)
      });
      const data = await response.json();
      if (data.success) setSearchResults(data.data);
      else setError(data.error || 'Search failed');
    } catch (err) {
      setError('Network error occurred');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async (member: SeasonMember) => {
    setBusyId(member.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/database/transfer-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id })
      });
      const data = await response.json();
      if (data.success) {
        replaceMember({ ...member, in_2027: true });
        const mc = data.data.mailchimp;
        setNotice(`${t('memberSearch.migrated')}: ${member.first_name ?? ''} ${member.last_name ?? ''}` +
          (mc?.ok ? ' — MailChimp: Activos 26-27 ✓' : ''));
        if (mc && !mc.ok && !mc.skipped) setError(`MailChimp: ${mc.error}`);
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (err) {
      setError('Network error occurred during migration');
      console.error('Migrate error:', err);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (member: SeasonMember) => {
    setError(null);
    setNotice(null);
    setEditingId(member.id);
    setEditForm({
      member_number: member.member_number ?? '',
      first_name: member.first_name ?? '',
      last_name: member.last_name ?? '',
      email: member.email ?? '',
      phone: member.phone ?? ''
    });
  };

  const handleSave = async (member: SeasonMember) => {
    setBusyId(member.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/database/update-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: '2026', id: member.id, fields: editForm })
      });
      const data = await response.json();
      if (data.success) {
        replaceMember({ ...data.data.member, in_2027: member.in_2027 });
        setEditingId(null);
        const mc = data.data.mailchimp;
        setNotice(t('memberSearch.saved') +
          (data.data.updated2027 ? ' — 2027 ✓' : '') +
          (mc?.ok ? ' — MailChimp ✓' : ''));
        if (mc && !mc.ok && !mc.skipped) setError(`MailChimp: ${mc.error}`);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Network error occurred while saving');
      console.error('Update error:', err);
    } finally {
      setBusyId(null);
    }
  };

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('memberSearch.title')}</h2>
        <p className="text-gray-600 mb-6">{t('memberSearch.description')}</p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('memberSearch.memberNumber')}</label>
            <input
              type="text"
              value={searchCriteria.member_number}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, member_number: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={inputClass}
              placeholder="Enter member number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('memberSearch.email')}</label>
            <input
              type="text"
              value={searchCriteria.email}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, email: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={inputClass}
              placeholder="Enter email or part of email (e.g., 'gmail')"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('common.loading') : t('memberSearch.searchButton')}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {notice && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700">{notice}</p>
          </div>
        )}
      </div>

      {searchResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {t('memberSearch.foundMember')} ({searchResults.count})
          </h3>

          {searchResults.members.length === 0 ? (
            <p className="text-gray-600">{t('memberSearch.noResults')}</p>
          ) : (
            <div className="space-y-4">
              {searchResults.members.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  {editingId === member.id ? (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        {EDIT_FIELDS.map((f) => (
                          <div key={f}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel(f)}</label>
                            <input
                              type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                              value={editForm[f] ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, [f]: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={busyId === member.id}
                          className="py-2 px-4 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={() => handleSave(member)}
                          disabled={busyId === member.id}
                          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          {busyId === member.id ? t('memberSearch.saving') : t('common.save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </h4>
                        <p className="text-sm text-gray-600"><strong>Member #:</strong> {member.member_number || '—'}</p>
                        <p className="text-sm text-gray-600"><strong>Email:</strong> {member.email || '—'}</p>
                        <p className="text-sm text-gray-600"><strong>Phone:</strong> {member.phone || '—'}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {member.in_2027 ? (
                          <span className="py-2 px-4 rounded-md bg-gray-100 text-gray-600 text-sm">
                            ✓ {t('memberSearch.alreadyIn2027')}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMigrate(member)}
                            disabled={busyId === member.id}
                            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {busyId === member.id ? t('common.loading') : t('memberSearch.transferButton')}
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(member)}
                          disabled={busyId === member.id}
                          className="bg-white border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          {t('memberSearch.editButton')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
