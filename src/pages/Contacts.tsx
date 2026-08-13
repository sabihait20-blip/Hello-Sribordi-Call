import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Video,
  MessageSquare,
  Trash2,
  UserX,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToContacts, removeContact } from '../services/contactService';
import { Contact, UserProfile, CallType } from '../types';

interface ContactsProps {
  onStartCall: (user: UserProfile, type: CallType) => void;
  onOpenChat: (user: UserProfile) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ onStartCall, onOpenChat }) => {
  const { userProfile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToContacts(userProfile.uid, (data) => {
      setContacts(data);
    });
    return () => unsub();
  }, [userProfile]);

  const handleRemove = async (contactUid: string) => {
    if (!userProfile) return;
    try {
      await removeContact(userProfile.uid, contactUid);
    } catch (e) {
      console.warn('Failed to remove contact:', e);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const p = c.profile;
    if (!p) return false;
    const term = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.username.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Contacts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your saved friends and call contacts
          </p>
        </div>

        {/* Search inside contacts */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <UserX className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No Contacts Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchFilter
              ? `No contacts matching "${searchFilter}"`
              : 'You have not added any contacts yet. Search users on the Dashboard to add them!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((c) => {
            const p = c.profile;
            if (!p) return null;

            return (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                      alt={p.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        p.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      @{p.username}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.isOnline
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {p.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {p.secretCode && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {p.secretCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onStartCall(p, 'audio')}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-transform"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartCall(p, 'video')}
                    className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-105 transition-transform"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenChat(p)}
                    className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 hover:scale-105 transition-transform"
                    title="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(p.uid)}
                    className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:scale-105 transition-transform"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
