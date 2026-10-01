'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface DatabaseStatus {
  connected: boolean;
  files?: {
    list2026?: { name: string; count: number };
    list2027?: { name: string; count: number };
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

export default function AdminDashboard() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ connected: false });
  const [mailchimpStatus, setMailchimpStatus] = useState<MailChimpStatus>({ success: false, configured: false, connected: false });

  useEffect(() => {
    checkDatabaseStatus();
    checkMailChimpStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status', { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success) {
        setDbStatus({
          connected: data.data.connected,
          files: {
            list2026: { name: 'Members 2026', count: data.data.tables?.members_2026 || 0 },
            list2027: { name: 'Members 2027', count: data.data.tables?.members_2027 || 0 }
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
    }
  };

  const checkMailChimpStatus = async () => {
    try {
      const response = await fetch('/api/mailchimp/status', { cache: 'no-store' });
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your club&apos;s member database and system settings</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">2026</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">2026 Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dbStatus.files?.list2026?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">2027</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">2027 Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dbStatus.files?.list2027?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  mailchimpStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="text-white text-sm">📧</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">MailChimp</p>
                <p className="text-sm font-semibold text-gray-900">
                  {mailchimpStatus.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <button 
            onClick={() => window.open('/api/database/export/2026', '_blank')}
            className="group w-full"
          >
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <span className="text-purple-600 text-xl">📥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600">Export 2026</h3>
                  <p className="text-sm text-gray-500">Download 2026 members as Excel file</p>
                </div>
              </div>
            </div>
          </button>

          <button 
            onClick={() => window.open('/api/database/export/2027', '_blank')}
            className="group w-full"
          >
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <span className="text-indigo-600 text-xl">📥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">Export 2027</h3>
                  <p className="text-sm text-gray-500">Download 2027 members as Excel file</p>
                </div>
              </div>
            </div>
          </button>


        </div>

        {/* System Status Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status Overview</h3>
          
          <div className="space-y-4">
            {/* Database Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  dbStatus.connected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">Database Connection</span>
              </div>
              <span className={`text-sm ${
                dbStatus.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {dbStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* MailChimp Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  mailchimpStatus.connected ? 'bg-green-500' : 
                  mailchimpStatus.configured ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">MailChimp Integration</span>
              </div>
              <span className={`text-sm ${
                mailchimpStatus.connected ? 'text-green-600' : 
                mailchimpStatus.configured ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {mailchimpStatus.connected ? 'Connected' : 
                 mailchimpStatus.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {!mailchimpStatus.connected && mailchimpStatus.error && (
              <p className="text-xs text-red-600 break-all">{mailchimpStatus.error}</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
