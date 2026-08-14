import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Video,
  MessageSquare,
  Trash2,
  UserX,
  UserPlus,
  KeyRound,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToContacts, removeContact, addContact } from '../services/contactService';
import { getUserBySecretCode } from '../services/userService';
import { Contact, UserProfile, CallType } from '../types';

interface ContactsProps {
  onStartCall: (user: UserProfile, type: CallType) => void;
  onOpenChat: (user: UserProfile) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ onStartCall, onOpenChat }) => {
  const { userProfile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Quick Add by Secret Code state
  const [inputCode, setInputCode] = useState('');
  const [addingCode, setAddingCode] = useState(false);
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleAddByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !inputCode.trim()) return;

    setAddingCode(true);
    setAddStatus(null);

    try {
      const peer = await getUserBySecretCode(inputCode);
      if (!peer) {
        setAddStatus({ type: 'error', text: `No user found with Secret Code "${inputCode.toUpperCase()}"` });
      } else if (peer.uid === userProfile.uid) {
        setAddStatus({ type: 'error', text: 'You cannot add your own Secret Code as a contact.' });
      } else {
        const alreadyInContacts = contacts.some((c) => c.contactUid === peer.uid);
        if (alreadyInContacts) {
          setAddStatus({ type: 'error', text: `${peer.name} (@${peer.username}) is already in your contacts.` });
        } else {
          await addContact(userProfile.uid, peer.uid);
          setAddStatus({ type: 'success', text: `Added ${peer.name} (@${peer.username}) to your contacts!` });
          setInputCode('');
        }
      }
    } catch (err) {
      setAddStatus({ type: 'error', text: 'Failed to add contact. Please check the code and try again.' });
    } finally {
      setAddingCode(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const p = c.profile;
    if (!p) return false;
    const term = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.username.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.secretCode && p.secretCode.toLowerCase().includes(term))
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
            Manage your saved friends, connect by Permanent Secret Code, and call directly
          </p>
        </div>

        {/* Search inside contacts */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search name, user, or secret code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Add Contact by Secret Code Quick Bar */}
      <div className="p-5 rounded-3xl bg-indigo-50/60 dark:bg-slate-900/80 border border-indigo-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Add Friend by Permanent Secret Code
          </h2>
          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
            e.g. SEC-ABCD-1234
          </span>
        </div>

        <form onSubmit={handleAddByCode} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-indigo-500" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                setAddStatus(null);
              }}
              placeholder="Enter friend's Secret Code to save them..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-600 placeholder:normal-case placeholder:font-sans placeholder:font-normal"
            />
          </div>
          <button
            type="submit"
            disabled={addingCode || !inputCode.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            {addingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Add Contact</span>
          </button>
        </form>

        {addStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              addStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
            }`}
          >
            {addStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{addStatus.text}</span>
          </div>
        )}
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
              : 'You have not added any contacts yet. Enter a friend\'s Secret Code above to add them!'}
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
