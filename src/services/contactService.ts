import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Contact, UserProfile } from '../types';

export async function addContact(userUid: string, contactUid: string): Promise<void> {
  if (userUid === contactUid) throw new Error("You cannot add yourself as a contact.");
  const contactRef = doc(db, 'users', userUid, 'contacts', contactUid);
  await setDoc(contactRef, {
    id: contactUid,
    userUid,
    contactUid,
    createdAt: Date.now(),
  });
}

export async function removeContact(userUid: string, contactUid: string): Promise<void> {
  const contactRef = doc(db, 'users', userUid, 'contacts', contactUid);
  await deleteDoc(contactRef);
}

export function subscribeToContacts(
  userUid: string,
  onContactsChange: (contacts: Contact[]) => void
) {
  const contactsRef = collection(db, 'users', userUid, 'contacts');

  return onSnapshot(contactsRef, async (snapshot) => {
    const contactList: Contact[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const contactUid = data.contactUid;

      // Fetch latest profile of contact
      const userDocRef = doc(db, 'users', contactUid);
      const userSnap = await getDoc(userDocRef);
      const profile = userSnap.exists() ? (userSnap.data() as UserProfile) : undefined;

      contactList.push({
        id: docSnap.id,
        userUid,
        contactUid,
        createdAt: data.createdAt,
        profile,
      });
    }

    onContactsChange(contactList);
  });
}
