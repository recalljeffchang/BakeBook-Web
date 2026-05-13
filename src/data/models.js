// src/data/models.js
// All data models (mirrors Models.swift structs)

export const RECIPE_CATEGORIES = ['全部', '麵包', '蛋糕', '餅乾', '點心'];

export const DIFFICULTIES = {
  '入門': { color: '#3D9E6A', bg: '#EAF3DE', text: '#27500A' },
  '中等': { color: '#EF9F27', bg: '#FEF3E7', text: '#633806' },
  '進階': { color: '#4A7FBD', bg: '#EBF3FF', text: '#1A4A8A' },
};

export const INGREDIENT_CATEGORIES = ['粉類', '乳製品', '酵母', '糖鹽', '油脂', '其他'];

export const CATEGORY_EMOJI = {
  '粉類': '🌾', '乳製品': '🥛', '酵母': '🧂',
  '糖鹽': '🍬', '油脂': '🫙', '其他': '🧺',
};

export const CATEGORY_BG = {
  '粉類': '#FEF3E7', '乳製品': '#F0F8FF', '酵母': '#FEF3E7',
  '糖鹽': '#FFF0F5', '油脂': '#FFFDE7', '其他': '#F5F5F5',
};

export function stockStatus(item) {
  if (item.currentStock <= 0) return 'empty';
  if (item.currentStock < item.minimumThreshold) return 'low';
  if (item.currentStock / item.initialStock < 0.3) return 'low';
  return 'ok';
}

export const STOCK_STATUS_META = {
  ok:    { color: '#3D9E6A', bg: '#EAF3DE', textColor: '#27500A', label: '充足' },
  low:   { color: '#EF9F27', bg: '#FAEEDA', textColor: '#633806', label: '庫存不足' },
  empty: { color: '#E24B4A', bg: '#FCEBEB', textColor: '#791F1F', label: '已用盡' },
};

export function formatAmount(amount) {
  if (amount >= 10) return String(Math.round(amount));
  return amount.toFixed(1).replace(/\.0$/, '');
}

export function formatTime(totalMinutes) {
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  }
  return `${totalMinutes}m`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return '早安，烘焙師 👋';
  if (h < 18) return '午安，烘焙師 👋';
  return '晚安，烘焙師 👋';
}

export function displayStock(item) {
  if (item.currentStock >= 1000 && item.unit === 'g')
    return `${(item.currentStock / 1000).toFixed(1)}kg`;
  return `${formatAmount(item.currentStock)}${item.unit}`;
}
