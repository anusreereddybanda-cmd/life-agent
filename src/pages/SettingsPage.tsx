import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Cloud,
  Download,
  ShieldAlert,
  Bell,
  Palette,
  LogOut,
} from 'lucide-react';
import { supabase } from '../supabase';

export default function SettingsPage({ userEmail }: { userEmail?: string }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth', { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'Could not sign out. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-serif text-sage-800 mb-2">Settings</h1>
        <p className="text-ink-400">Manage your account, privacy, and data.</p>
      </header>

      <section className="glass-panel p-6 md:p-8" aria-labelledby="account-heading">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="account-heading" className="text-2xl font-serif text-ink-900 mb-2">
              Account
            </h2>
            <p className="text-sm text-ink-400">Signed-in account email</p>
            <p className="mt-1 font-medium text-ink-700">
              {userEmail || 'Email is not available for this account.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <span>Signing out...</span>
            ) : (
              <>
                <LogOut size={18} />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
        {logoutError && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            Could not log out: {logoutError}
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <SettingTab icon={<Lock size={18}/>} label="Security & Privacy" active />
          <SettingTab icon={<Cloud size={18}/>} label="Backup & Sync" />
          <SettingTab icon={<Palette size={18}/>} label="Appearance" />
          <SettingTab icon={<Bell size={18}/>} label="Notifications" />
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-ink-900 mb-1">Data Storage & Recovery</h2>
              <p className="text-sm text-ink-400">Manage how your memories are stored and backed up.</p>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
              <ShieldAlert size={24} className="flex-shrink-0" />
              <p className="text-sm">
                <strong>Important Notice:</strong> Please ensure your data is synced to the cloud. 
                Only data successfully saved or backed up to MyLife can be recovered through MyLife on other devices.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-cream-200 rounded-xl hover:bg-cream-50 transition-colors">
                <div>
                  <h3 className="font-medium text-ink-900">Cloud Sync</h3>
                  <p className="text-sm text-ink-400">Automatically backup memories to your private cloud</p>
                </div>
                <div className="w-12 h-6 bg-sage-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-cream-200 rounded-xl hover:bg-cream-50 transition-colors">
                <div>
                  <h3 className="font-medium text-ink-900">End-to-End Encryption</h3>
                  <p className="text-sm text-ink-400">Encrypt data before it leaves your device</p>
                </div>
                <div className="w-12 h-6 bg-sage-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-cream-200">
              <h3 className="font-medium text-ink-900 mb-4">Export Your Data</h3>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-cream-300 rounded-lg text-ink-600 hover:bg-cream-100 transition-colors font-medium">
                <Download size={18} />
                Download Archive (ZIP)
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function SettingTab({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
      active ? 'bg-sage-100 text-sage-800 font-medium' : 'text-ink-500 hover:bg-cream-100'
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
