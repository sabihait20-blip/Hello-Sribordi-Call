import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Phone,
  Video,
  Send,
  CheckCheck,
  Smile,
  Search,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  KeyRound,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getChatId,
  sendMessage,
  subscribeToMessages,
  subscribeToConversations,
  markMessagesAsSeen,
} from '../services/chatService';
import { uploadToImgBB } from '../services/imgbbService';
import { getUserBySecretCode } from '../services/userService';
import { ChatMessage, ChatConversation, UserProfile, CallType } from '../types';

interface MessagesProps {
  initialPeerUser?: UserProfile | null;
  onStartCall: (user: UserProfile, type: CallType) => void;
}

export const Messages: React.FC<MessagesProps> = ({
  initialPeerUser,
  onStartCall,
}) => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activePeer, setActivePeer] = useState<UserProfile | null>(initialPeerUser || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchConvo, setSearchConvo] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Chat by Secret Code state
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set initial active peer if passed
  useEffect(() => {
    if (initialPeerUser) {
      setActivePeer(initialPeerUser);
    }
  }, [initialPeerUser]);

  // Subscribe to conversations list
  useEffect(() => {
    if (!userProfile) return;
    const unsub = subscribeToConversations(userProfile.uid, (convos) => {
      setConversations(convos);
      // Auto select first conversation if none selected
      if (!activePeer && convos.length > 0 && convos[0].peerUser) {
        setActivePeer(convos[0].peerUser);
      }
    });
    return () => unsub();
  }, [userProfile]);

  // Subscribe to messages when activePeer changes
  useEffect(() => {
    if (!userProfile || !activePeer) return;
    const chatId = getChatId(userProfile.uid, activePeer.uid);

    markMessagesAsSeen(chatId, userProfile.uid);

    const unsub = subscribeToMessages(chatId, (data) => {
      setMessages(data);
    });

    return () => unsub();
  }, [userProfile, activePeer]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !activePeer || !inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');

    try {
      await sendMessage(userProfile.uid, activePeer.uid, textToSend, 'text');
    } catch (err) {
      console.warn('Failed to send message:', err);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile || !activePeer) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadToImgBB(file);
      await sendMessage(userProfile.uid, activePeer.uid, imageUrl, 'image');
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleLookupAndStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !userProfile) return;

    setCodeLoading(true);
    setCodeError(null);
    try {
      const peer = await getUserBySecretCode(inputCode);
      if (!peer) {
        setCodeError(`No user found with code "${inputCode.toUpperCase()}"`);
      } else if (peer.uid === userProfile.uid) {
        setCodeError('You cannot chat with your own code.');
      } else {
        setActivePeer(peer);
        setInputCode('');
        setShowCodeInput(false);
      }
    } catch (err) {
      setCodeError('Failed to lookup secret code.');
    } finally {
      setCodeLoading(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const peer = c.peerUser;
    if (!peer) return false;
    const term = searchConvo.toLowerCase();
    return (
      peer.name.toLowerCase().includes(term) ||
      peer.username.toLowerCase().includes(term) ||
      (peer.secretCode && peer.secretCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen p-2 md:p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Conversations Sidebar */}
      <div
        className={`w-full md:w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col shrink-0 ${
          activePeer ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Messages
          </h2>
          <button
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors text-xs font-bold flex items-center gap-1"
            title="Chat by Secret Code"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Start Chat by Secret Code input */}
        {showCodeInput && (
          <form onSubmit={handleLookupAndStartChat} className="mb-3 space-y-2 p-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setCodeError(null);
                }}
                placeholder="Enter Secret Code..."
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={codeLoading || !inputCode.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shrink-0"
              >
                {codeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Chat'}
              </button>
            </div>
            {codeError && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{codeError}</span>
              </p>
            )}
          </form>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchConvo}
            onChange={(e) => setSearchConvo(e.target.value)}
            placeholder="Search chats or code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredConversations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No chat history yet. Select a contact or user to start chatting.
            </p>
          ) : (
            filteredConversations.map((c) => {
              const peer = c.peerUser;
              if (!peer) return null;
              const isSelected = activePeer?.uid === peer.uid;

              return (
                <div
                  key={c.chatId}
                  onClick={() => setActivePeer(peer)}
                  className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={peer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer.username}`}
                      alt={peer.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                        isSelected ? 'border-indigo-600' : 'border-white dark:border-slate-900'
                      } ${peer.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : ''}`}>
                      {peer.name}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {c.lastMessage || 'No messages'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Active Chat Area */}
      {activePeer ? (
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActivePeer(null)}
                className="md:hidden text-xs text-indigo-600 font-bold p-1"
              >
                ← Back
              </button>
              <div className="relative">
                <img
                  src={
                    activePeer.photoURL ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${activePeer.username}`
                  }
                  alt={activePeer.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    activePeer.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {activePeer.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activePeer.isOnline ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Quick Calling Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartCall(activePeer, 'audio')}
                className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:scale-105 transition-transform"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartCall(activePeer, 'video')}
                className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-105 transition-transform"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>Say hello to {activePeer.name}! 👋</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === userProfile?.uid;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-bl-none'
                      }`}
                    >
                      {m.type === 'image' ? (
                        <div className="space-y-1">
                          <a
                            href={m.text}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-xl group relative"
                          >
                            <img
                              src={m.text}
                              alt="Shared attachment"
                              className="max-h-60 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity"
                            />
                            <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </a>
                        </div>
                      ) : (
                        <p className="leading-relaxed break-words">{m.text}</p>
                      )}
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMe && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${m.seen ? 'text-emerald-300' : 'text-indigo-300'}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {uploadingImage && (
              <div className="flex justify-end">
                <div className="bg-indigo-600/80 text-white px-4 py-2 rounded-2xl text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading image via ImgBB...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emoji Bar */}
          <div className="px-4 py-1.5 bg-slate-100/60 dark:bg-slate-800/40 flex items-center gap-2 overflow-x-auto text-sm">
            {['👍', '❤️', '😊', '🔥', '🎉', '👋', '📞', '📹'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            {/* ImgBB Image Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              disabled={uploadingImage}
              className="hidden"
            />
            <button
              type="button"
              title="Upload image via ImgBB"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 items-center justify-center p-8 text-center text-slate-400">
          <div>
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};
