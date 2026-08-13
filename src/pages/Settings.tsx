import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Camera,
  Mic,
  Bell,
  Lock,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isDarkMode,
  toggleDarkMode,
}) => {
  const { logout, resetPassword, userProfile } = useAuth();

  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  const testMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setCameraStatus('Granted');
      setMicStatus('Granted');
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: unknown) {
      const error = err as Error;
      setCameraStatus('Denied or Unavailable');
      setMicStatus('Denied or Unavailable');
      console.warn('Media permission test error:', error);
    }
  };

  const testNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setNotifStatus('Not Supported');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifStatus(perm === 'granted' ? 'Enabled' : 'Denied');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          App Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure calling hardware, notifications, appearance, and security
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            Appearance & Theme
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust the color scheme for comfortable day or night viewing
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {isDarkMode ? 'Dark Enabled' : 'Light Enabled'}
            </button>
          </div>
        </div>

        {/* Media & Hardware Diagnostics */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Calling Hardware & Permissions
            </h2>
            <button
              onClick={testMediaPermissions}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Check Permissions
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Camera Access</span>
              </div>
              {cameraStatus ? (
                <span className={`text-xs font-bold ${cameraStatus === 'Granted' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {cameraStatus}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Not tested</span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Microphone Access</span>
              </div>
              {micStatus ? (
                <span className={`text-xs font-bold ${micStatus === 'Granted' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {micStatus}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Not tested</span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Browser Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Receive pop-up alerts for incoming calls when the browser tab is inactive
              </p>
            </div>
            <button
              onClick={testNotificationPermission}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
            >
              Request Permission
            </button>
          </div>
          {notifStatus && (
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Notification Status: {notifStatus}
            </p>
          )}
        </div>

        {/* Security & Password */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Security & Authentication
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Password Reset
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send a reset email link to {userProfile?.email}
              </p>
            </div>
            <button
              onClick={() => userProfile?.email && resetPassword(userProfile.email)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
            >
              Send Link
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Account Action
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign out from this device session
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
