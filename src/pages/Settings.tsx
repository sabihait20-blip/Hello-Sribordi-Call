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
  KeyRound,
  Copy,
  RefreshCw,
  Check,
  Database,
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
  const { logout, resetPassword, userProfile, regenerateMySecretCode, savePinSecurity } = useAuth();

  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  // Secret code and PIN states
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [pin, setPin] = useState(userProfile?.pinCode || '');
  const [isPinEnabled, setIsPinEnabled] = useState(userProfile?.isPinLocked || false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinStatusMsg, setPinStatusMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    if (userProfile?.secretCode) {
      navigator.clipboard.writeText(userProfile.secretCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    try {
      await regenerateMySecretCode();
    } catch (e) {
      console.warn('Failed to regenerate code:', e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSavePin = async () => {
    if (isPinEnabled && pin.length !== 4) {
      setPinStatusMsg('Secret PIN must be 4 digits');
      return;
    }
    setSavingPin(true);
    try {
      await savePinSecurity(pin, isPinEnabled);
      setPinStatusMsg(isPinEnabled ? 'PIN Lock Enabled!' : 'PIN Lock Disabled');
      setTimeout(() => setPinStatusMsg(null), 3000);
    } catch (e) {
      setPinStatusMsg('Failed to update PIN');
    } finally {
      setSavingPin(false);
    }
  };

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

        {/* Active Secret Code & Security */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Active Secret Code & Security
            </h2>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
              {userProfile?.secretCode || 'Active'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                My Direct Secret Code
              </p>
              <p className="text-xl font-black font-mono tracking-wider text-slate-900 dark:text-white mt-0.5">
                {userProfile?.secretCode || 'Generating...'}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Reset Code</span>
              </button>
            </div>
          </div>

          {/* PIN Lock Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    App Secret PIN Lock
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Require a 4-digit secret PIN code to unlock app
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPinEnabled(!isPinEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPinEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPinEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isPinEnabled && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-digit PIN"
                  className="w-full sm:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleSavePin}
                  disabled={savingPin || pin.length !== 4}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {savingPin ? 'Saving...' : 'Save PIN'}
                </button>
                {pinStatusMsg && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {pinStatusMsg}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cloud Database & Realtime Sync Status */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Cloud Database & Realtime Sync
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Database Online & Open
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Firestore cloud database is active, synced with WebRTC signaling, user contacts, and messages.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Project ID</span>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">hellosribordi</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Database ID</span>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">(default)</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Security Rules</span>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Deployed & Active</p>
            </div>
          </div>
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
