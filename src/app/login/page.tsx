'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        const next = new URLSearchParams(window.location.search).get('next') || '/';
        // Only allow same-site paths
        window.location.href = next.startsWith('/') && !next.startsWith('//') ? next : '/';
      } else {
        setError(response.status === 401 ? 'Contraseña incorrecta / Wrong password' : data.error || 'Error');
        setPassword('');
      }
    } catch {
      setError('Error de red / Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Club Amistades Belgas de Levante</h1>
          <p className="text-sm text-gray-500 mt-2">Contraseña · Wachtwoord · Mot de passe</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-blue-600 text-white py-3 rounded-md text-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? '...' : 'Entrar'}
        </button>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
