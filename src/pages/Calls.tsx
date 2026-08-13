import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Phone,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToCallHistory } from '../services/callService';
import { getUserProfile } from '../services/userService';
import { CallHistoryRecord, UserProfile, CallType } from '../types';

interface CallsProps {
  onStartCall: (user: UserProfile, type: CallType) => void;
}

export const Calls: React.FC<CallsProps> = ({ onStartCall }) => {
  const { userProfile } = useAuth();
  const [history, setHistory] = useState<CallHistoryRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing' | 'missed' | 'audio' | 'video'>('all');

  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToCallHistory(userProfile.uid, (data) => {
      setHistory(data);
    });
    return () => unsub();
  }, [userProfile]);

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
            Call History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logs of all your audio and video calls
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
