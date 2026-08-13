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

export async function createUserProfileDoc(
  uid: string,
  data: { name: string; username: string; email: string; photoURL?: string; bio?: string; phone?: string }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const now = Date.now();
  const profile: UserProfile = {
    uid,
    name: data.name,
    username: data.username.toLowerCase().trim(),
    email: data.email.toLowerCase().trim(),
    photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.username)}`,
    bio: data.bio || 'Hello! I am using Calling App.',
    phone: data.phone || '',
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
    return snap.data() as UserProfile;
  }
  return null;
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

      if (matchName || matchUsername || matchEmail) {
        results.push(data);
        addedUids.add(data.uid);
      }
    }
  });

  return results;
}

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
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
