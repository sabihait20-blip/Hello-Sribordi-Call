import React, { useState } from 'react';
import { ShieldCheck, Lock, Delete, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SecretPinLockScreenProps {
  onUnlock: () => void;
}

export const SecretPinLockScreen: React.FC<SecretPinLockScreenProps> = ({ onUnlock }) => {
  const { userProfile, logout } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setError(false);
      if (next.length === 4) {
        // Verify PIN
        if (next === userProfile?.pinCode) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPinInput('');
            setError(false);
          }, 700);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm flex flex-col items-center space-y-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-600/20">
          <KeyRound className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            App Locked with Secret Code
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your 4-digit Secret Security PIN to unlock
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-4 my-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pinInput.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  error
                    ? 'bg-rose-500 animate-shake'
                    : isFilled
                    ? 'bg-indigo-500 scale-110 shadow-md shadow-indigo-500/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-400 animate-pulse">
            Incorrect Secret PIN. Please try again.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-white transition-transform active:scale-95 flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={logout}
            className="h-14 rounded-2xl bg-transparent hover:bg-slate-900/50 text-xs font-semibold text-slate-400 transition-colors flex items-center justify-center"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-lg font-bold text-white transition-transform active:scale-95 flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-transform active:scale-95 flex items-center justify-center shadow-sm"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
