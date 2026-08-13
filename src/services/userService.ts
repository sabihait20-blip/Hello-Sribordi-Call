import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  where,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { UserProfile } from '../types';
import { uploadToImgBB } from './imgbbService';

/**
 * Generate a random 6-character active secret code (e.g. "SEC-7821" or "849201")
 */
export function generateSecretCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const numericPart = Math.floor(1000 + Math.random() * 9000);
  return `SEC-${randomPart}${numericPart}`;
}

export async function createUserProfileDoc(
  uid: string,
  data: {
    name: string;
    username: string;
    email: string;
    photoURL?: string;
    bio?: string;
    phone?: string;
    secretCode?: string;
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const now = Date.now();
  const secretCode = data.secretCode || generateSecretCode();
  const profile: UserProfile = {
    uid,
    name: data.name,
    username: data.username.toLowerCase().trim(),
    email: data.email.toLowerCase().trim(),
    photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.username)}`,
    bio: data.bio || 'Hello! I am using Calling App.',
    phone: data.phone || '',
    secretCode,
    isPinLocked: false,
    isOnline: true,
    lastSeen: now,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(userRef, profile, { merge: true });
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    // Auto-generate and activate secret code if missing
    if (!data.secretCode) {
      const code = generateSecretCode();
      await updateDoc(userRef, { secretCode: code });
      data.secretCode = code;
    }
    return data;
  }
  return null;
}

export async function getUserBySecretCode(secretCode: string): Promise<UserProfile | null> {
  if (!secretCode || !secretCode.trim()) return null;
  const codeClean = secretCode.trim().toUpperCase();
  const usersRef = collection(db, 'users');

  try {
    const qSnap = await getDocs(query(usersRef, where('secretCode', '==', codeClean), limit(1)));
    if (!qSnap.empty) {
      return qSnap.docs[0].data() as UserProfile;
    }
  } catch (err) {
    console.warn('Query by secretCode error:', err);
  }

  // Fallback search in memory in case of indexing delay
  try {
    const allSnap = await getDocs(query(usersRef, limit(40)));
    for (const d of allSnap.docs) {
      const u = d.data() as UserProfile;
      if (u.secretCode && u.secretCode.toUpperCase() === codeClean) {
        return u;
      }
    }
  } catch (err) {
    console.warn('Memory search error:', err);
  }

  return null;
}

export async function regenerateSecretCode(uid: string): Promise<string> {
  const newCode = generateSecretCode();
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    secretCode: newCode,
    updatedAt: Date.now(),
  });
  return newCode;
}

export async function updateUserPin(uid: string, pin: string, enabled: boolean): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    pinCode: pin,
    isPinLocked: enabled,
    updatedAt: Date.now(),
  });
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function updateUserPresence(uid: string, isOnline: boolean): Promise<void> {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: Date.now(),
    });
  } catch (e) {
    console.warn('Failed to update presence:', e);
  }
}

export async function searchUsers(searchTerm: string, currentUid: string): Promise<UserProfile[]> {
  if (!searchTerm || !searchTerm.trim()) return [];
  const term = searchTerm.toLowerCase().trim();
  const termUpper = searchTerm.toUpperCase().trim();

  const usersRef = collection(db, 'users');
  const results: UserProfile[] = [];
  const addedUids = new Set<string>();

  // Fetch users and filter by term in memory or prefix queries
  const qSnap = await getDocs(query(usersRef, limit(30)));
  qSnap.forEach((docSnap) => {
    const data = docSnap.data() as UserProfile;
    if (data.uid !== currentUid && !addedUids.has(data.uid)) {
      const matchName = data.name.toLowerCase().includes(term);
      const matchUsername = data.username.toLowerCase().includes(term);
      const matchEmail = data.email.toLowerCase().includes(term);
      const matchCode = data.secretCode ? data.secretCode.toUpperCase().includes(termUpper) : false;

      if (matchName || matchUsername || matchEmail || matchCode) {
        results.push(data);
        addedUids.add(data.uid);
      }
    }
  });

  return results;
}

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  // First attempt: Upload to ImgBB API
  try {
    const imgbbUrl = await uploadToImgBB(file);
    return imgbbUrl;
  } catch (imgbbErr) {
    console.warn('ImgBB upload error, attempting Firebase Storage fallback:', imgbbErr);
  }

  // Second attempt: Firebase Storage
  try {
    const storageRef = ref(storage, `profile_photos/${uid}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Storage upload error, using local data URL fallback:', err);
    // Return a base64 fallback data url if storage is denied/unconfigured
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
