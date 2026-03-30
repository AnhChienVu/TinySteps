import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type AuthError,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const authError = error as AuthError;

    switch (authError.code) {
      case 'auth/popup-closed-by-user':
        return 'The Google sign-in popup was closed before finishing.';
      case 'auth/popup-blocked':
        return 'The browser blocked the Google sign-in popup.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized in Firebase Authentication.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled in Firebase Authentication.';
      default:
        return authError.message;
    }
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });
  return user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutCurrentUser() {
  await signOut(auth);
}
