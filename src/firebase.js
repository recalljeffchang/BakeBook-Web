// src/firebase.js
// Firebase initialization — BakeBook cloud sync

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYYgmXmRjVGBP6GnZuo5X8q7JRj5TKtGs",
  authDomain: "bakebook-a26f8.firebaseapp.com",
  projectId: "bakebook-a26f8",
  storageBucket: "bakebook-a26f8.firebasestorage.app",
  messagingSenderId: "447847875651",
  appId: "1:447847875651:web:c2ef8ba911c50b51b640f6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence (Firestore caches data locally for offline use)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence only works in one tab
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('Firestore persistence not supported in this browser');
  }
});
