'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface DebugResult {
  success: boolean;
  headers?: string[];
  headerMapping?: Record<string, number>;
  sampleData?: string[][];
  error?: string;
}

export default function AdminDebugPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

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
      const response = await fetch('/api/debug-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: 'Network error occurred during analysis'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug Excel</h1>
          <p className="mt-2 text-gray-600">Analyze Excel file structure and format to troubleshoot import issues</p>
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
                className="bg-yellow-600 text-white py-2 px-6 rounded-md hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze File'}
              </button>
              
              <div className="text-sm text-gray-500">
                {file && `Selected: ${file.name}`}
              </div>
            </div>
          </form>

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-6">
              <div className={`p-4 rounded-md ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-lg font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Analysis Complete' : 'Analysis Failed'}
                </h3>
                {result.error && (
                  <p className={`mt-2 text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.error}
                  </p>
                )}
              </div>

              {result.success && result.headers && (
                <div className="space-y-6">
                  {/* Headers Found */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Headers Found</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {result.headers.map((header, index) => (
                        <div key={index} className="bg-white px-3 py-2 rounded border text-sm">
                          <span className="text-gray-500">#{index}:</span> {header}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Header Mapping */}
                  {result.headerMapping && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Header Mapping</h4>
                      <div className="space-y-2">
                        {Object.entries(result.headerMapping).map(([field, index]) => (
                          <div key={field} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                            <span className="font-medium text-gray-700">{field}</span>
                            <span className="text-sm text-gray-500">
                              Column {index}: &quot;{result.headers?.[index]}&quot;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Data */}
                  {result.sampleData && result.sampleData.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">Sample Data (First 3 Rows)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded">
                          <thead className="bg-gray-100">
                            <tr>
                              {result.headers?.map((header, index) => (
                                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.sampleData.slice(0, 3).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2 text-sm text-gray-700 border-r">
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Instructions</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Upload an Excel file to analyze its structure and format</p>
              <p>• Check if headers match expected format: Apellido, Nombre, LID NR, MAIL-ADRES, TELEFOONNR., BETAALD, Status</p>
              <p>• Review sample data to ensure proper formatting</p>
              <p>• Use this tool before importing to identify potential issues</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
