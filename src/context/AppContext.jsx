// src/context/AppContext.jsx
// Global state — cloud sync via Firestore + localStorage fallback

import { createContext, useContext, useReducer, useMemo, useEffect, useRef, useCallback } from 'react';
import { SAMPLE_RECIPES, SAMPLE_JOURNAL, SAMPLE_INVENTORY } from '../data/sampleData';
import { stockStatus } from '../data/models';
import { v4 as uuid } from '../utils/uuid';
import { useAuth } from './AuthContext';
import {
  saveDocToFirestore, deleteDocFromFirestore, saveAllToFirestore, listenToCollection,
} from './firestoreSync';

// ─── localStorage helpers (offline fallback) ────────────────────────────────
const loadLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

const saveLS = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {} // eslint-disable-line no-empty -- localStorage may be full/unavailable
};

const initialState = {
  recipes: loadLS('bb_recipes', SAMPLE_RECIPES),
  journal: loadLS('bb_journal', SAMPLE_JOURNAL),
  inventory: loadLS('bb_inventory', SAMPLE_INVENTORY),
  syncStatus: 'idle', // idle | syncing | synced | error
  lastSyncTime: null,
};

function reducer(state, action) {
  switch (action.type) {
    // ── Cloud sync actions ──
    case 'SET_RECIPES': {
      const recipes = action.payload;
      saveLS('bb_recipes', recipes);
      return { ...state, recipes };
    }
    case 'SET_JOURNAL': {
      const journal = action.payload;
      saveLS('bb_journal', journal);
      return { ...state, journal };
    }
    case 'SET_INVENTORY': {
      const inventory = action.payload;
      saveLS('bb_inventory', inventory);
      return { ...state, inventory };
    }
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload, syncStatus: 'synced' };

    // ── Recipe actions ──
    case 'ADD_RECIPE': {
      const recipes = [action.payload, ...state.recipes];
      saveLS('bb_recipes', recipes);
      return { ...state, recipes };
    }
    case 'UPDATE_RECIPE': {
      const recipes = state.recipes.map(r =>
        r.id === action.payload.id ? { ...r, ...action.payload } : r
      );
      saveLS('bb_recipes', recipes);
      return { ...state, recipes };
    }
    case 'DELETE_RECIPE': {
      const recipes = state.recipes.filter(r => r.id !== action.payload);
      saveLS('bb_recipes', recipes);
      return { ...state, recipes };
    }

    // ── Journal actions ──
    case 'ADD_JOURNAL': {
      const entry = action.payload;
      // deduct inventory
      let inventory = [...state.inventory];
      const recipe = state.recipes.find(r => r.id === entry.recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ing => {
          const idx = inventory.findIndex(item =>
            item.name.toLowerCase().includes(ing.name.toLowerCase()) ||
            ing.name.toLowerCase().includes(item.name.toLowerCase())
          );
          if (idx >= 0) {
            const log = { id: uuid(), date: new Date().toISOString(), change: -ing.amount, reason: `${entry.recipeName}（${entry.quantity}件）日誌扣減` };
            inventory[idx] = {
              ...inventory[idx],
              currentStock: Math.max(0, inventory[idx].currentStock - ing.amount),
              usageLog: [log, ...inventory[idx].usageLog],
            };
          }
        });
      }
      const journal = [entry, ...state.journal];
      saveLS('bb_journal', journal);
      saveLS('bb_inventory', inventory);
      return { ...state, journal, inventory };
    }
    case 'DELETE_JOURNAL': {
      const journal = state.journal.filter(e => e.id !== action.payload);
      saveLS('bb_journal', journal);
      return { ...state, journal };
    }

    // ── Inventory actions ──
    case 'ADD_INVENTORY': {
      const inventory = [action.payload, ...state.inventory];
      saveLS('bb_inventory', inventory);
      return { ...state, inventory };
    }
    case 'UPDATE_STOCK': {
      const { itemId, change, reason } = action.payload;
      const inventory = state.inventory.map(item => {
        if (item.id !== itemId) return item;
        const log = { id: uuid(), date: new Date().toISOString(), change, reason };
        return { ...item, currentStock: Math.max(0, item.currentStock + change), usageLog: [log, ...item.usageLog] };
      });
      saveLS('bb_inventory', inventory);
      return { ...state, inventory };
    }
    default: return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, isLoggedIn } = useAuth();
  const unsubsRef = useRef([]);
  const hasUploadedRef = useRef(false);

  // ─── Firestore: real-time listeners (when logged in) ──────────────────────
  useEffect(() => {
    // Clean up previous listeners
    unsubsRef.current.forEach(unsub => unsub());
    unsubsRef.current = [];
    hasUploadedRef.current = false;

    if (!isLoggedIn || !user?.uid) return;

    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });

    const uid = user.uid;
    let recipesReceived = false;
    let journalReceived = false;
    let inventoryReceived = false;

    const checkAllReceived = () => {
      if (recipesReceived && journalReceived && inventoryReceived) {
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
      }
    };

    // Listen to recipes
    const unsubRecipes = listenToCollection(uid, 'recipes', (items) => {
      if (items.length > 0) {
        dispatch({ type: 'SET_RECIPES', payload: items });
      } else if (!hasUploadedRef.current) {
        // First login — Firestore is empty, upload local data
        hasUploadedRef.current = true;
        const localRecipes = loadLS('bb_recipes', SAMPLE_RECIPES);
        saveAllToFirestore(uid, 'recipes', localRecipes);
      }
      recipesReceived = true;
      checkAllReceived();
    });

    // Listen to journal
    const unsubJournal = listenToCollection(uid, 'journal', (items) => {
      if (items.length > 0) {
        dispatch({ type: 'SET_JOURNAL', payload: items });
      } else if (!hasUploadedRef.current) {
        const localJournal = loadLS('bb_journal', SAMPLE_JOURNAL);
        saveAllToFirestore(uid, 'journal', localJournal);
      }
      journalReceived = true;
      checkAllReceived();
    });

    // Listen to inventory
    const unsubInventory = listenToCollection(uid, 'inventory', (items) => {
      if (items.length > 0) {
        dispatch({ type: 'SET_INVENTORY', payload: items });
      } else if (!hasUploadedRef.current) {
        const localInventory = loadLS('bb_inventory', SAMPLE_INVENTORY);
        saveAllToFirestore(uid, 'inventory', localInventory);
      }
      inventoryReceived = true;
      checkAllReceived();
    });

    unsubsRef.current = [unsubRecipes, unsubJournal, unsubInventory];

    return () => {
      unsubsRef.current.forEach(unsub => unsub());
      unsubsRef.current = [];
    };
  }, [isLoggedIn, user?.uid]);

  // ─── Firestore: write-through on state changes ────────────────────────────
  const syncToFirestore = useCallback((colName, item, action) => {
    if (!isLoggedIn || !user?.uid) return;
    const uid = user.uid;
    if (action === 'delete') {
      deleteDocFromFirestore(uid, colName, item);
    } else {
      saveDocToFirestore(uid, colName, item);
    }
  }, [isLoggedIn, user?.uid]);

  // Wrap dispatch to also sync to Firestore
  const syncDispatch = useCallback((action) => {
    dispatch(action);

    // Sync to Firestore based on action type
    if (!isLoggedIn || !user?.uid) return;
    const uid = user.uid;

    switch (action.type) {
      case 'ADD_RECIPE':
      case 'UPDATE_RECIPE':
        saveDocToFirestore(uid, 'recipes', action.payload);
        break;
      case 'DELETE_RECIPE':
        deleteDocFromFirestore(uid, 'recipes', action.payload);
        break;
      case 'ADD_JOURNAL': {
        saveDocToFirestore(uid, 'journal', action.payload);
        // Also sync updated inventory items
        // We need to get the updated state, so we do a full save after a tick
        setTimeout(() => {
          const inv = loadLS('bb_inventory', []);
          saveAllToFirestore(uid, 'inventory', inv);
        }, 100);
        break;
      }
      case 'DELETE_JOURNAL':
        deleteDocFromFirestore(uid, 'journal', action.payload);
        break;
      case 'ADD_INVENTORY':
        saveDocToFirestore(uid, 'inventory', action.payload);
        break;
      case 'UPDATE_STOCK': {
        setTimeout(() => {
          const inv = loadLS('bb_inventory', []);
          const updated = inv.find(i => i.id === action.payload.itemId);
          if (updated) saveDocToFirestore(uid, 'inventory', updated);
        }, 100);
        break;
      }
    }
  }, [isLoggedIn, user?.uid, syncToFirestore]);

  // ─── Derived values (same as before) ──────────────────────────────────────
  const value = useMemo(() => {
    const now = new Date();
    const thisMonth = (d) => {
      const date = new Date(d);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const monthlyRevenue = state.journal
      .filter(e => thisMonth(e.date) && e.saleEnabled)
      .reduce((sum, e) => sum + e.soldQuantity * e.unitPrice, 0);

    const monthlyEntryCount = state.journal.filter(e => thisMonth(e.date)).length;
    const totalOutputCount = state.journal.reduce((sum, e) => sum + e.quantity, 0);

    const lowStockItems = state.inventory.filter(item => stockStatus(item) !== 'ok');
    const totalInventoryValue = state.inventory.reduce((sum, item) => {
      const unitCost = item.initialStock > 0 ? item.purchasePrice / item.initialStock : 0;
      return sum + item.currentStock * unitCost;
    }, 0);

    const recipesForCategory = (cat) =>
      cat === '全部' ? state.recipes : state.recipes.filter(r => r.category === cat);

    const checkIngredientSufficiency = (recipe) =>
      recipe.ingredients.map(ing => {
        const item = state.inventory.find(inv =>
          inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
          ing.name.toLowerCase().includes(inv.name.toLowerCase())
        );
        if (!item) return null;
        return { name: ing.name, required: ing.amount, available: item.currentStock, unit: ing.unit, sufficient: item.currentStock >= ing.amount };
      }).filter(Boolean);

    return {
      ...state,
      dispatch: syncDispatch,
      monthlyRevenue,
      monthlyEntryCount,
      totalOutputCount,
      lowStockItems,
      totalInventoryValue,
      recipesForCategory,
      checkIngredientSufficiency,
    };
  }, [state, syncDispatch]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useApp hook intentionally co-exported with AppProvider
export const useApp = () => useContext(AppContext);
