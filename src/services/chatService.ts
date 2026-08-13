import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage, ChatConversation, UserProfile } from '../types';

export function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  text: string,
  type: 'text' | 'image' | 'call_log' = 'text'
): Promise<void> {
  if (!text.trim() && type === 'text') return;

  const chatId = getChatId(senderId, receiverId);
  const now = Date.now();

  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      chatId,
      participantUids: [senderId, receiverId],
      lastMessage: text,
      lastMessageTime: now,
      updatedAt: now,
    },
    { merge: true }
  );

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    senderId,
    receiverId,
    text: text.trim(),
    type,
    createdAt: now,
    seen: false,
  });
}

export function subscribeToMessages(
  chatId: string,
  onMessages: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatMessage, 'id'>),
      });
    });
    onMessages(messages);
  });
}

export async function markMessagesAsSeen(chatId: string, currentUid: string): Promise<void> {
  try {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('receiverId', '==', currentUid), where('seen', '==', false));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      updateDoc(docSnap.ref, { seen: true });
    });
  } catch (err) {
    console.warn('Error marking messages as seen:', err);
  }
}

export function subscribeToConversations(
  currentUid: string,
  onConversations: (conversations: ChatConversation[]) => void
) {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participantUids', 'array-contains', currentUid));

  return onSnapshot(q, async (snapshot) => {
    const convos: ChatConversation[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const participants: string[] = data.participantUids || [];
      const peerUid = participants.find((id) => id !== currentUid) || currentUid;

      // Fetch peer profile
      const userRef = doc(db, 'users', peerUid);
      const userSnap = await getDoc(userRef);
      const peerUser = userSnap.exists() ? (userSnap.data() as UserProfile) : undefined;

      convos.push({
        chatId: docSnap.id,
        participantUids: participants,
        lastMessage: data.lastMessage || '',
        lastMessageTime: data.lastMessageTime || Date.now(),
        peerUser,
      });
    }

    // Sort by last message time descending
    convos.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    onConversations(convos);
  });
}
