'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
      <header className="bg-red-600 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-semibold text-white hover:text-red-200">
                🔧 Admin Panel - {t('navigation.title')}
              </Link>
              
              {/* Admin Navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin" className="text-red-100 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="border border-red-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
              
              {/* Back to User View */}
              <Link 
                href="/" 
                className="text-sm text-red-100 hover:text-white transition-colors"
              >
                ← Back to User View
              </Link>

              <button onClick={logout} className="text-sm text-red-100 hover:text-white transition-colors">
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
      <footer className="bg-red-600 border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-red-100">
            <p>🔧 Admin Panel - © 2025 Club Amistades Belgas de Levante</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
