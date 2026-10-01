'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!mounted) {
    return null;
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                {t('navigation.title')}
              </Link>
              
              {/* User Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/search" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('navigation.searchMembers')}
                </Link>
                <Link href="/add" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('navigation.addMember')}
                </Link>
              </nav>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
              
              {/* Admin Link */}
              <Link 
                href="/admin" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Admin
              </Link>

              <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Club Amistades Belgas de Levante. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
