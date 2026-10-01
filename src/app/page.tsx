'use client';

import { useTranslation } from 'react-i18next';
import UserLayout from '@/components/UserLayout';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('navigation.title')}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Search Members Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('navigation.searchMembers')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('memberSearch.description')}
            </p>
            <Link href="/search" className="block">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                {t('memberSearch.searchButton')}
              </button>
            </Link>
          </div>

          {/* Add Member Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('navigation.addMember')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('home.addDescription')}
            </p>
            <Link href="/add" className="block">
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                {t('memberForm.submitButton')}
              </button>
            </Link>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}
// Trigger redeploy with environment variables
