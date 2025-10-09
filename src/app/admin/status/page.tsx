'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface DatabaseStatus {
  connected: boolean;
  files?: {
    list2025?: { name: string; count: number };
    list2026?: { name: string; count: number };
  };
  error?: string;
}

interface MailChimpStatus {
  success: boolean;
  configured: boolean;
  connected: boolean;
  audience?: {
    name: string;
    member_count: number;
    id: string;
  };
  error?: string;
}

export default function AdminStatusPage() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ connected: false });
  const [mailchimpStatus, setMailchimpStatus] = useState<MailChimpStatus>({ success: false, configured: false, connected: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
    checkMailChimpStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json();
      
      if (data.success) {
        setDbStatus({
          connected: data.data.connected,
          files: {
            list2025: { name: 'Members 2025', count: data.data.tables?.members_2025 || 0 },
            list2026: { name: 'Members 2026', count: data.data.tables?.members_2026 || 0 }
          }
        });
      } else {
        setDbStatus({
          connected: false,
          error: data.error || 'Failed to connect to database'
        });
      }
    } catch {
      setDbStatus({
        connected: false,
        error: 'Failed to connect to database'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMailChimpStatus = async () => {
    try {
      const response = await fetch('/api/mailchimp/status');
      const data = await response.json();
      setMailchimpStatus(data);
    } catch {
      setMailchimpStatus({
        success: false,
        configured: false,
        connected: false,
        error: 'Failed to check MailChimp status'
      });
    }
  };

  const refreshStatus = () => {
    setLoading(true);
    checkDatabaseStatus();
    checkMailChimpStatus();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="mt-2 text-gray-600">Monitor database connections and system health</p>
            </div>
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Database Status</h2>
              <div className={`w-4 h-4 rounded-full ${
                dbStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Connection</span>
                <span className={`text-sm font-medium ${
                  dbStatus.connected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dbStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {dbStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{dbStatus.error}</p>
                </div>
              )}

              {dbStatus.connected && dbStatus.files && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">Database Tables</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium text-gray-900">Members 2025</p>
                        <p className="text-sm text-gray-500">Current year members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {dbStatus.files.list2025?.count || 0}
                        </p>
                        <p className="text-sm text-gray-500">members</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium text-gray-900">Members 2026</p>
                        <p className="text-sm text-gray-500">Next year members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {dbStatus.files.list2026?.count || 0}
                        </p>
                        <p className="text-sm text-gray-500">members</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MailChimp Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">MailChimp Integration</h2>
              <div className={`w-4 h-4 rounded-full ${
                mailchimpStatus.connected ? 'bg-green-500' : 
                mailchimpStatus.configured ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <span className={`text-sm font-medium ${
                  mailchimpStatus.connected ? 'text-green-600' : 
                  mailchimpStatus.configured ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {mailchimpStatus.connected ? 'Connected' : 
                   mailchimpStatus.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              {mailchimpStatus.audience && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-800 mb-1">Audience Information</h4>
                  <p className="text-sm text-green-700">
                    <strong>Name:</strong> {mailchimpStatus.audience.name}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Members:</strong> {mailchimpStatus.audience.member_count}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>ID:</strong> {mailchimpStatus.audience.id}
                  </p>
                </div>
              )}

              {mailchimpStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{mailchimpStatus.error}</p>
                </div>
              )}

              {!mailchimpStatus.configured && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>To enable MailChimp integration:</p>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                      <li>Get your MailChimp API key</li>
                      <li>Find your server prefix (e.g., us1, us2)</li>
                      <li>Get your audience ID</li>
                      <li>Add them to your <code>.env.local</code> file</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Application</h3>
              <p className="text-sm text-gray-900">Club Management System</p>
              <p className="text-sm text-gray-500">Version 1.0.0</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Database</h3>
              <p className="text-sm text-gray-900">Supabase PostgreSQL</p>
              <p className="text-sm text-gray-500">Free Tier</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Email Marketing</h3>
              <p className="text-sm text-gray-900">MailChimp Integration</p>
              <p className="text-sm text-gray-500">
                {mailchimpStatus.connected ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
