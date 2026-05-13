// src/context/AuthContext.jsx
// Firebase Authentication context — Google sign-in

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user object
  const [loading, setLoading] = useState(true);  // true while checking auth state
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Google sign-in
  const loginWithGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // Handle popup closed by user
      if (err.code === 'auth/popup-closed-by-user') {
        return; // Not an error — user just cancelled
      }
      console.error('Login error:', err);
      setError(err.message || '登入失敗');
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    user,
    loading,
    error,
    loginWithGoogle,
    logout,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth hook intentionally co-exported
export const useAuth = () => useContext(AuthContext);
