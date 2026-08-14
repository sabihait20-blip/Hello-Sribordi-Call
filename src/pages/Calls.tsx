import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Phone,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Filter,
  KeyRound,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToCallHistory } from '../services/callService';
import { getUserProfile, getUserBySecretCode } from '../services/userService';
import { CallHistoryRecord, UserProfile, CallType } from '../types';

interface CallsProps {
  onStartCall: (user: UserProfile, type: CallType) => void;
}

export const Calls: React.FC<CallsProps> = ({ onStartCall }) => {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState<CallHistoryRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing' | 'missed' | 'audio' | 'video'>('all');

  // Quick Dial by Secret Code
  const [dialCode, setDialCode] = useState('');
  const [dialing, setDialing] = useState(false);
  const [dialError, setDialError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToCallHistory(userProfile.uid, (data) => {
      setHistory(data);
    });
    return () => unsub();
  }, [userProfile]);

  const handleDial = async (type: CallType) => {
    if (!dialCode.trim()) return;
    setDialing(true);
    setDialError(null);

    try {
      const peer = await getUserBySecretCode(dialCode);
      if (!peer) {
        setDialError(`No user found with Secret Code "${dialCode.toUpperCase()}"`);
      } else if (peer.uid === userProfile?.uid) {
        setDialError('You cannot call your own Secret Code.');
      } else {
        onStartCall(peer, type);
      }
    } catch (err) {
      setDialError('Failed to establish call connection. Please try again.');
    } finally {
      setDialing(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'incoming') return item.direction === 'incoming';
    if (filter === 'outgoing') return item.direction === 'outgoing';
    if (filter === 'missed') return item.status === 'missed';
    if (filter === 'audio') return item.type === 'audio';
    if (filter === 'video') return item.type === 'video';
    return true;
  });

  const formatDuration = (secs: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleRedial = async (peerUid: string, type: CallType) => {
    const peer = await getUserProfile(peerUid);
    if (peer) {
      onStartCall(peer, type);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <PhoneCall className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Calls & Direct Dialer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logs of your calls and instant direct dialing by Permanent Secret Code
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'incoming', 'outgoing', 'missed', 'audio', 'video'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Secret Code Quick Dialer */}
      <div className="p-5 rounded-3xl bg-indigo-50/60 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Direct Dial by Permanent Secret Code
          </h2>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            Enter Secret Code & Choose Call Type
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-indigo-500" />
            <input
              type="text"
              value={dialCode}
              onChange={(e) => {
                setDialCode(e.target.value.toUpperCase());
                setDialError(null);
              }}
              placeholder="e.g. SEC-ABCD-1234..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:normal-case placeholder:font-sans placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDial('audio')}
              disabled={dialing || !dialCode.trim()}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              {dialing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              <span>Audio Call</span>
            </button>
            <button
              onClick={() => handleDial('video')}
              disabled={dialing || !dialCode.trim()}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              {dialing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              <span>Video Call</span>
            </button>
          </div>
        </div>

        {dialError && (
          <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dialError}</span>
          </div>
        )}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Clock className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No Call Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No call logs match the selected filter tab.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredHistory.map((item) => {
            const isIncoming = item.direction === 'incoming';
            const peerUid = isIncoming ? item.callerId : item.receiverId;
            const peerName = isIncoming ? item.callerName : item.receiverName;
            const peerPhoto = isIncoming ? item.callerPhoto : item.receiverPhoto;

            return (
              <div
                key={item.id}
                className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={peerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`}
                    alt={peerName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {peerName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isIncoming ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Incoming
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Outgoing
                        </span>
                      )}
                      <span>•</span>
                      <span className="capitalize font-semibold">{item.type}</span>
                      <span>•</span>
                      <span>{new Date(item.startedAt).toLocaleDateString()} {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      Duration: {formatDuration(item.duration)}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                        item.status === 'missed'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : item.status === 'rejected'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRedial(peerUid, 'audio')}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-transform"
                      title="Callback Audio"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRedial(peerUid, 'video')}
                      className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-105 transition-transform"
                      title="Callback Video"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
