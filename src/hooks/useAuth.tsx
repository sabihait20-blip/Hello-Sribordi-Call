import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getUserProfile, createUserProfileDoc, updateUserProfile, regenerateSecretCode, updateUserPin } from '../services/userService';
import { UserProfile } from '../types';
import { usePresence } from './usePresence';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    username: string,
    email: string,
    pass: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  regenerateMySecretCode: () => Promise<string | null>;
  savePinSecurity: (pin: string, enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Presence hook
  usePresence(currentUser?.uid);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
      } else if (currentUser) {
        // Auto create profile doc if missing
        const newProfile = await createUserProfileDoc(uid, {
          name: currentUser.displayName || 'User',
          username: (currentUser.email?.split('@')[0] || `user_${uid.slice(0, 5)}`).toLowerCase(),
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
        });
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (
    name: string,
    username: string,
    email: string,
    pass: string
  ) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCred.user;
    
    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn('Email verification send notice:', e);
    }

    const profile = await createUserProfileDoc(user.uid, {
      name,
      username,
      email,
    });
    setUserProfile(profile);
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      const profile = await getUserProfile(res.user.uid);
      if (!profile) {
        await createUserProfileDoc(res.user.uid, {
          name: res.user.displayName || 'User',
          username: (res.user.email?.split('@')[0] || `user_${res.user.uid.slice(0, 5)}`).toLowerCase(),
          email: res.user.email || '',
          photoURL: res.user.photoURL || undefined,
        });
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    await updateUserProfile(currentUser.uid, updates);
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const regenerateMySecretCode = async (): Promise<string | null> => {
    if (!currentUser || !userProfile) return null;
    const newCode = await regenerateSecretCode(currentUser.uid);
    setUserProfile((prev) => (prev ? { ...prev, secretCode: newCode } : null));
    return newCode;
  };

  const savePinSecurity = async (pin: string, enabled: boolean): Promise<void> => {
    if (!currentUser || !userProfile) return;
    await updateUserPin(currentUser.uid, pin, enabled);
    setUserProfile((prev) =>
      prev ? { ...prev, pinCode: pin, isPinLocked: enabled } : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshProfile,
        updateProfileData,
        regenerateMySecretCode,
        savePinSecurity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
