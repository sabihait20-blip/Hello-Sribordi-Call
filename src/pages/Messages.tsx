import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Phone,
  Video,
  Send,
  CheckCheck,
  Smile,
  Search,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getChatId,
  sendMessage,
  subscribeToMessages,
  subscribeToConversations,
  markMessagesAsSeen,
} from '../services/chatService';
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const filteredConversations = conversations.filter((c) => {
    const peer = c.peerUser;
    if (!peer) return false;
    return (
      peer.name.toLowerCase().includes(searchConvo.toLowerCase()) ||
      peer.username.toLowerCase().includes(searchConvo.toLowerCase())
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Messages
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchConvo}
            onChange={(e) => setSearchConvo(e.target.value)}
            placeholder="Search chats..."
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
                      <p className="leading-relaxed break-words">{m.text}</p>
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
