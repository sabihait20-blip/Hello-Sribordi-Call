import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  Video,
  MessageSquare,
  UserPlus,
  UserCheck,
  Sparkles,
  PhoneCall,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { searchUsers } from '../services/userService';
import { addContact, removeContact, subscribeToContacts } from '../services/contactService';
import { subscribeToCallHistory } from '../services/callService';
import { UserProfile, Contact, CallHistoryRecord, CallType } from '../types';

interface DashboardProps {
  onStartCall: (user: UserProfile, type: CallType) => void;
  onOpenChat: (user: UserProfile) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onStartCall,
  onOpenChat,
  onNavigateTab,
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallHistoryRecord[]>([]);

  // Listen to contacts
  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToContacts(userProfile.uid, (data) => {
      setContacts(data);
    });
    return () => unsub();
  }, [userProfile]);

  // Listen to call history
  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToCallHistory(userProfile.uid, (data) => {
      setRecentCalls(data.slice(0, 5)); // show top 5
    });
    return () => unsub();
  }, [userProfile]);

  // Handle user search
  useEffect(() => {
    if (!userProfile || !searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchTerm, userProfile.uid);
        setSearchResults(results);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, userProfile]);

  const isContact = (targetUid: string) => {
    return contacts.some((c) => c.contactUid === targetUid);
  };

  const handleToggleContact = async (targetUid: string) => {
    if (!userProfile) return;
    try {
      if (isContact(targetUid)) {
        await removeContact(userProfile.uid, targetUid);
      } else {
        await addContact(userProfile.uid, targetUid);
      }
    } catch (err) {
      console.warn('Toggle contact error:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 md:p-8 shadow-xl shadow-indigo-600/15">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Calling & Messaging</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {userProfile?.name || 'User'}!
            </h1>
            <p className="text-sm text-indigo-100/80 max-w-lg">
              Start crystal clear WebRTC audio and video calls, manage contacts, and chat in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('contacts')}
              className="px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 shadow-lg transition-all"
            >
              My Contacts ({contacts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Search Users
        </h2>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, @username, or email address..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
          />
          {isSearching && (
            <Loader2 className="w-5 h-5 absolute right-4 top-4 text-indigo-600 animate-spin" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <div
                key={user.uid}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onStartCall(user, 'audio')}
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 hover:scale-105 transition-transform"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartCall(user, 'video')}
                    className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 hover:scale-105 transition-transform"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenChat(user)}
                    className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 hover:scale-105 transition-transform"
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleContact(user.uid)}
                    className={`p-2.5 rounded-xl hover:scale-105 transition-transform ${
                      isContact(user.uid)
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    title={isContact(user.uid) ? 'Remove Contact' : 'Add Contact'}
                  >
                    {isContact(user.uid) ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !isSearching && (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic p-2">
            No registered users found matching "{searchTerm}".
          </p>
        )}
      </div>

      {/* Grid Section: Contacts Quick Bar & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Contacts */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              My Contacts
            </h2>
            <button
              onClick={() => onNavigateTab('contacts')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No contacts added yet. Search users above and click the Add Contact button!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.slice(0, 4).map((c) => {
                const profile = c.profile;
                if (!profile) return null;
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                          alt={profile.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                            profile.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {profile.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {profile.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartCall(profile, 'audio')}
                        className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-transform"
                        title="Audio Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStartCall(profile, 'video')}
                        className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-105 transition-transform"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Calls Widget */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Recent Calls
            </h2>
            <button
              onClick={() => onNavigateTab('calls')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              See History
            </button>
          </div>

          {recentCalls.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No recent calls logged yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCalls.map((call) => {
                const isIncoming = call.direction === 'incoming';
                const peerName = isIncoming ? call.callerName : call.receiverName;
                const peerPhoto = isIncoming ? call.callerPhoto : call.receiverPhoto;

                return (
                  <div
                    key={call.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={peerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName}`}
                        alt={peerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                          {peerName}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {isIncoming ? (
                            <ArrowDownLeft
                              className={`w-3.5 h-3.5 ${
                                call.status === 'missed' ? 'text-rose-500' : 'text-emerald-500'
                              }`}
                            />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span className="capitalize">{call.type} Call</span>
                          <span>•</span>
                          <span>
                            {new Date(call.startedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        call.status === 'missed'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          : call.status === 'rejected'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}
                    >
                      {call.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
