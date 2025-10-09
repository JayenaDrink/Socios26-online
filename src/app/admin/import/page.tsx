'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/database/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        message: 'Network error occurred during import'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
          <p className="mt-2 text-gray-600">Upload Excel files to import members into the 2025 database</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: .xlsx, .xls
              </p>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={!file || loading}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Importing...' : 'Import Members'}
              </button>
              
              <div className="text-sm text-gray-500">
                {file && `Selected: ${file.name}`}
              </div>
            </div>
          </form>

          {/* Results */}
          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className={`text-2xl ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>{result.message}</p>
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside mt-1">
                          {result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Import Instructions</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Excel file should contain columns: Apellido, Nombre, LID NR, MAIL-ADRES, TELEFOONNR., BETAALD, Status</p>
              <p>• Members will be imported to the 2025 database</p>
              <p>• Duplicate member numbers will be skipped</p>
              <p>• Use the Debug Excel tool to analyze file structure before importing</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
