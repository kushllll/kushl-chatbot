'use client';

import { useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  isFirebaseConfigured,
} from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  token: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If running in development without Firebase keys configured
    if (!isFirebaseConfigured || !auth) {
      // Check if developer previously logged in locally
      const storedDevToken = localStorage.getItem('kushal_dev_token');
      if (storedDevToken) {
        setToken(storedDevToken);
        setUser({
          uid: 'dev_user',
          email: 'developer@kushalchat.ai',
          displayName: 'Kushal Dev',
          photoURL: '/pp.png',
        });
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      const res = await signInWithGoogle();
      if (res) {
        setToken(res.token);
        setUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        });
        if (!isFirebaseConfigured) {
          localStorage.setItem('kushal_dev_token', res.token);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await signOutUser();
    localStorage.removeItem('kushal_dev_token');
    setUser(null);
    setToken(null);
    setLoading(false);
  };

  return { user, token, loading, signIn, signOut };
}
