// src/context/AppContext.jsx
// Global state — mirrors AppStore.swift (ObservableObject)

import { createContext, useContext, useReducer, useMemo } from 'react';
import { SAMPLE_RECIPES, SAMPLE_JOURNAL, SAMPLE_INVENTORY } from '../data/sampleData';
import { stockStatus } from '../data/models';
import { v4 as uuid } from '../utils/uuid';

const loadLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

const saveLS = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

const initialState = {
  recipes: loadLS('bb_recipes', SAMPLE_RECIPES),
  journal: loadLS('bb_journal', SAMPLE_JOURNAL),
  inventory: loadLS('bb_inventory', SAMPLE_INVENTORY),
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_RECIPE': {
      const recipes = [action.payload, ...state.recipes];
      saveLS('bb_recipes', recipes);
      return { ...state, recipes };
    }
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
      dispatch,
      monthlyRevenue,
      monthlyEntryCount,
      totalOutputCount,
      lowStockItems,
      totalInventoryValue,
      recipesForCategory,
      checkIngredientSufficiency,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
