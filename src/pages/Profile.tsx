import React, { useState } from 'react';
import {
  User,
  AtSign,
  Mail,
  Phone,
  FileText,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  CloudUpload,
  Sparkles,
  KeyRound,
  Copy,
  RefreshCw,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { uploadProfileImage } from '../services/userService';

export const Profile: React.FC = () => {
  const { userProfile, updateProfileData, regenerateMySecretCode, savePinSecurity } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');

  // Secret code and PIN states
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [pin, setPin] = useState(userProfile?.pinCode || '');
  const [isPinEnabled, setIsPinEnabled] = useState(userProfile?.isPinLocked || false);
  const [savingPin, setSavingPin] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const newCode = await regenerateMySecretCode();
      if (newCode) {
        setMessage({ type: 'success', text: `New Secret Code activated: ${newCode}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to regenerate secret code.' });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSavePin = async () => {
    if (isPinEnabled && pin.length !== 4) {
      setMessage({ type: 'error', text: 'Secret PIN must be exactly 4 digits.' });
      return;
    }
    setSavingPin(true);
    try {
      await savePinSecurity(pin, isPinEnabled);
      setMessage({
        type: 'success',
        text: isPinEnabled
          ? 'Secret Security PIN activated successfully!'
          : 'Secret PIN lock disabled.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update PIN settings.' });
    } finally {
      setSavingPin(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    setUploading(true);
    setMessage(null);
    try {
      const url = await uploadProfileImage(userProfile.uid, file);
      setPhotoURL(url);
      await updateProfileData({ photoURL: url });
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Image upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setSaving(true);
    setMessage(null);
    try {
      await updateProfileData({
        name,
        username: username.toLowerCase().trim(),
        bio,
        phone,
        photoURL,
      });
      setMessage({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal information, avatar, and contact details
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        {/* Photo Upload Header */}
        <div className="flex flex-col items-center justify-center pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <img
              src={
                photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'user'}`
              }
              alt="Profile Avatar"
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-indigo-600/20 shadow-xl transition-all group-hover:brightness-90"
            />
            <label
              title="Upload new photo via ImgBB"
              className="absolute bottom-1 right-1 p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            <CloudUpload className="w-3.5 h-3.5" />
            <span>ImgBB Cloud Storage API Connected</span>
          </div>

          <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            {name || 'User'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{username || 'username'}
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={userProfile?.email || ''}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bio
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Secret Code & Security Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Secret Code & Security PIN
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your private identification code for fast direct calling and application lock
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
            Active
          </span>
        </div>

        {/* Secret Code Card */}
        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Personal Secret Code
            </span>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-black font-mono tracking-widest text-slate-900 dark:text-white">
                {userProfile?.secretCode || 'Generating...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Give this code to friends to let them call or message you immediately without your email.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* 4-digit PIN Security Lock */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  App Secret PIN Lock
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Require a 4-digit Secret PIN code whenever the app is opened
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
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-48">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-digit PIN"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                type="button"
                onClick={handleSavePin}
                disabled={savingPin || pin.length !== 4}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {savingPin ? 'Saving...' : 'Save Secret PIN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
