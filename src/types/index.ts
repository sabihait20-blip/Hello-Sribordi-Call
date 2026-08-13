export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  isOnline: boolean;
  lastSeen: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Contact {
  id: string;
  userUid: string;
  contactUid: string;
  createdAt: number;
  profile?: UserProfile;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed' | 'busy';

export interface CallSession {
  callId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  type: CallType;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: number;
  acceptedAt?: number | null;
  endedAt?: number | null;
  duration?: number; // in seconds
}

export interface CallHistoryRecord {
  id: string;
  callId: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerPhoto?: string;
  receiverName: string;
  receiverPhoto?: string;
  type: CallType;
  status: CallStatus;
  direction: 'incoming' | 'outgoing';
  duration: number;
  startedAt: number;
  endedAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  type: 'text' | 'image' | 'call_log';
  createdAt: number;
  seen: boolean;
}

export interface ChatConversation {
  chatId: string;
  participantUids: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: number;
  peerUser?: UserProfile;
}
