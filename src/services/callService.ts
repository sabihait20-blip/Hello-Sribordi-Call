import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CallSession, CallType, CallStatus, CallHistoryRecord } from '../types';

/**
 * Check if a user is currently engaged in an active call
 */
export async function isUserOnActiveCall(uid: string): Promise<boolean> {
  try {
    const callsRef = collection(db, 'calls');
    const q1 = query(callsRef, where('callerId', '==', uid), where('status', 'in', ['ringing', 'accepted']));
    const q2 = query(callsRef, where('receiverId', '==', uid), where('status', 'in', ['ringing', 'accepted']));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    return !snap1.empty || !snap2.empty;
  } catch (err) {
    console.warn('Error checking active call state:', err);
    return false;
  }
}

/**
 * Initiate an outgoing audio/video call
 */
export async function createCallSession(
  caller: { uid: string; name: string; photoURL?: string },
  receiver: { uid: string; name: string; photoURL?: string },
  type: CallType,
  offer: RTCSessionDescriptionInit
): Promise<string> {
  const onCall = await isUserOnActiveCall(receiver.uid);
  if (onCall) {
    throw new Error(`${receiver.name} is currently on another call.`);
  }

  const callDocRef = doc(collection(db, 'calls'));
  const callId = callDocRef.id;
  const now = Date.now();

  const sessionData: CallSession = {
    callId,
    callerId: caller.uid,
    callerName: caller.name,
    callerPhoto: caller.photoURL || '',
    receiverId: receiver.uid,
    receiverName: receiver.name,
    receiverPhoto: receiver.photoURL || '',
    type,
    status: 'ringing',
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
    createdAt: now,
  };

  await setDoc(callDocRef, sessionData);
  return callId;
}

/**
 * Answer an incoming call
 */
export async function answerCallSession(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  await updateDoc(callDocRef, {
    status: 'accepted',
    answer: {
      type: answer.type,
      sdp: answer.sdp,
    },
    acceptedAt: Date.now(),
  });
}

/**
 * Reject an incoming call
 */
export async function rejectCallSession(callId: string): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  const snap = await getDoc(callDocRef);
  if (snap.exists()) {
    const data = snap.data() as CallSession;
    await updateDoc(callDocRef, {
      status: 'rejected',
      endedAt: Date.now(),
    });
    await saveCallHistory(data, 'rejected', 0);
  }
}

/**
 * End an ongoing call
 */
export async function endCallSession(callId: string, durationInSeconds: number = 0): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  const snap = await getDoc(callDocRef);
  if (snap.exists()) {
    const data = snap.data() as CallSession;
    const finalStatus: CallStatus = data.status === 'ringing' ? 'missed' : 'ended';
    const now = Date.now();

    await updateDoc(callDocRef, {
      status: finalStatus,
      endedAt: now,
      duration: durationInSeconds,
    });

    await saveCallHistory(data, finalStatus, durationInSeconds);
  }
}

/**
 * Save call details to callHistory collection
 */
export async function saveCallHistory(
  session: CallSession,
  finalStatus: CallStatus,
  duration: number
): Promise<void> {
  try {
    const historyRef = collection(db, 'callHistory');
    const now = Date.now();

    await addDoc(historyRef, {
      callId: session.callId,
      callerId: session.callerId,
      receiverId: session.receiverId,
      callerName: session.callerName,
      callerPhoto: session.callerPhoto || '',
      receiverName: session.receiverName,
      receiverPhoto: session.receiverPhoto || '',
      type: session.type,
      status: finalStatus,
      duration,
      startedAt: session.acceptedAt || session.createdAt,
      endedAt: now,
    });
  } catch (e) {
    console.warn('Error saving call history:', e);
  }
}

/**
 * Add ICE candidates for Caller or Receiver
 */
export async function addIceCandidateToFirestore(
  callId: string,
  candidate: RTCIceCandidate,
  role: 'caller' | 'receiver'
): Promise<void> {
  try {
    const candidateCol = collection(
      db,
      'calls',
      callId,
      role === 'caller' ? 'callerCandidates' : 'receiverCandidates'
    );
    await addDoc(candidateCol, candidate.toJSON());
  } catch (err) {
    console.warn('Failed to add ICE candidate:', err);
  }
}

/**
 * Listen for incoming calls for a user
 */
export function listenToIncomingCalls(
  receiverUid: string,
  onIncomingCall: (call: CallSession) => void
) {
  const callsRef = collection(db, 'calls');
  const q = query(
    callsRef,
    where('receiverId', '==', receiverUid),
    where('status', '==', 'ringing')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as CallSession;
        onIncomingCall(data);
      }
    });
  });
}

/**
 * Listen to a call session document changes
 */
export function listenToCallSession(
  callId: string,
  onUpdate: (session: CallSession) => void
) {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(callDocRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as CallSession);
    }
  });
}

/**
 * Listen to ICE candidates from peer
 */
export function listenToPeerIceCandidates(
  callId: string,
  peerRole: 'caller' | 'receiver',
  onCandidate: (candidate: RTCIceCandidateInit) => void
) {
  const colRef = collection(
    db,
    'calls',
    callId,
    peerRole === 'caller' ? 'callerCandidates' : 'receiverCandidates'
  );

  return onSnapshot(colRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        onCandidate(change.doc.data() as RTCIceCandidateInit);
      }
    });
  });
}

/**
 * Get call history for a user
 */
export function subscribeToCallHistory(
  uid: string,
  onHistory: (history: CallHistoryRecord[]) => void
) {
  const historyRef = collection(db, 'callHistory');
  const q = query(historyRef, orderBy('startedAt', 'desc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const list: CallHistoryRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.callerId === uid || data.receiverId === uid) {
        list.push({
          id: docSnap.id,
          callId: data.callId,
          callerId: data.callerId,
          receiverId: data.receiverId,
          callerName: data.callerName,
          callerPhoto: data.callerPhoto,
          receiverName: data.receiverName,
          receiverPhoto: data.receiverPhoto,
          type: data.type,
          status: data.status,
          direction: data.callerId === uid ? 'outgoing' : 'incoming',
          duration: data.duration || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
        });
      }
    });
    onHistory(list);
  });
}
