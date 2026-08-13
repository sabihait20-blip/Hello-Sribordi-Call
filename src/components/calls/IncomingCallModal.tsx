import React from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { CallSession } from '../../types';

interface IncomingCallModalProps {
  incomingCall: CallSession | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center relative overflow-hidden">
        {/* Animated Ring Gradient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />

        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-emerald-400 animate-pulse">
            <img
              src={
                incomingCall.callerPhoto ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerName}`
              }
              alt={incomingCall.callerName}
              className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-indigo-600 text-white shadow-lg">
            {isVideo ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {incomingCall.callerName}
        </h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-6 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          Incoming {isVideo ? 'Video' : 'Audio'} Call...
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-6 w-full mt-2">
          {/* Decline */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-110 transition-transform">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Decline
            </span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Accept {isVideo ? 'Video' : 'Audio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
