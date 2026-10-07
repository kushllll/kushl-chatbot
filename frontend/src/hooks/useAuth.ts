'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';

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
  const { data: sessionData, isPending } = authClient.useSession();
  const [user, setUser] = useState<AuthState['user']>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      if (sessionData?.user) {
        setTokenLoading(true);
        // Pre-fill user details from session immediately
        setUser({
          uid: sessionData.user.id,
          email: sessionData.user.email || null,
          displayName: sessionData.user.name || null,
          photoURL: sessionData.user.image || null,
        });

        // Fast path: session payload token if already populated
        const sessionWithToken = sessionData as { session?: { token?: string } } | undefined;
        if (sessionWithToken?.session?.token) {
          setToken(sessionWithToken.session.token);
        }

        try {
          const tokenRes = await authClient.token();
          if (isMounted && tokenRes?.data?.token) {
            setToken(tokenRes.data.token);
          }
        } catch (err) {
          console.warn('Neon Auth token retrieval warning:', err);
        } finally {
          if (isMounted) {
            setTokenLoading(false);
          }
        }
      } else if (!isPending) {
        // Fallback for local development testing
        const storedDevToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('kushal_dev_token')
            : null;

        if (storedDevToken) {
          setToken(storedDevToken);
          setUser({
            uid: 'dev_user',
            email: 'developer@kushalchat.ai',
            displayName: 'Kushal Dev',
            photoURL: '/pp.png',
          });
        } else {
          setUser(null);
          setToken(null);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [sessionData, isPending]);

  const signIn = async () => {
    try {
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
      if (res?.error) {
        throw new Error(res.error.message || 'Neon Auth Google sign-in failed');
      }
    } catch (err) {
      console.warn('Neon Auth sign-in failed, falling back to local dev session:', err);
      const mockToken = 'mock-test-token:dev_user:developer@kushalchat.ai';
      if (typeof window !== 'undefined') {
        localStorage.setItem('kushal_dev_token', mockToken);
      }
      setToken(mockToken);
      setUser({
        uid: 'dev_user',
        email: 'developer@kushalchat.ai',
        displayName: 'Kushal Dev',
        photoURL: '/pp.png',
      });
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('Neon Auth sign-out error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kushal_dev_token');
      }
      setUser(null);
      setToken(null);
    }
  };

  return {
    user,
    token,
    loading: isPending || tokenLoading,
    signIn,
    signOut,
  };
}
