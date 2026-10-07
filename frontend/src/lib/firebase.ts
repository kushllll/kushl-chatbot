import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { auth, googleProvider };

export async function signInWithGoogle(): Promise<{ token: string; user: any } | null> {
  if (!auth || !googleProvider) {
    // If Firebase keys aren't set in local env, supply a local developer session
    const mockToken = 'mock-test-token:dev_user:developer@kushalchat.ai';
    return {
      token: mockToken,
      user: {
        uid: 'dev_user',
        email: 'developer@kushalchat.ai',
        displayName: 'Kushal Dev',
        photoURL: '/pp.png',
      },
    };
  }

  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  return { token, user: result.user };
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
