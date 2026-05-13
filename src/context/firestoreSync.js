// src/context/firestoreSync.js
// Firestore read/write helpers for cloud sync
// Each user gets their own data under: users/{userId}/recipes, users/{userId}/journal, users/{userId}/inventory

import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Collection references ──────────────────────────────────────────────────
const userCol = (userId, colName) => collection(db, 'users', userId, colName);
const userDoc = (userId, colName, docId) => doc(db, 'users', userId, colName, docId);

// ─── Write helpers ──────────────────────────────────────────────────────────
export async function saveDocToFirestore(userId, colName, item) {
  if (!userId || !item?.id) return;
  try {
    await setDoc(userDoc(userId, colName, item.id), item);
  } catch (err) {
    console.error(`Firestore write error (${colName}/${item.id}):`, err);
  }
}

export async function deleteDocFromFirestore(userId, colName, docId) {
  if (!userId || !docId) return;
  try {
    await deleteDoc(userDoc(userId, colName, docId));
  } catch (err) {
    console.error(`Firestore delete error (${colName}/${docId}):`, err);
  }
}

export async function saveAllToFirestore(userId, colName, items) {
  if (!userId || !items?.length) return;
  try {
    // Use batched writes for efficiency (max 500 per batch)
    const batchSize = 450;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + batchSize);
      chunk.forEach(item => {
        if (item.id) {
          batch.set(userDoc(userId, colName, item.id), item);
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.error(`Firestore batch write error (${colName}):`, err);
  }
}

// ─── Real-time listener ─────────────────────────────────────────────────────
// Returns an unsubscribe function
export function listenToCollection(userId, colName, callback) {
  if (!userId) return () => {};
  const ref = userCol(userId, colName);
  return onSnapshot(ref, (snapshot) => {
    const items = snapshot.docs.map(d => d.data());
    callback(items);
  }, (err) => {
    console.error(`Firestore listen error (${colName}):`, err);
  });
}
