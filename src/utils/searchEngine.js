// src/utils/searchEngine.js
// Multi-field weighted search with relevance scoring

const FIELD_WEIGHTS = {
  name: 10,
  subtitle: 6,
  category: 5,
  difficulty: 5,
  ingredient: 4,
  description: 3,
  step: 1,
};

/**
 * Score a single recipe against a single keyword.
 * Returns a numeric relevance score (0 = no match).
 */
function scoreRecipe(keyword, recipe) {
  const kw = keyword.toLowerCase();
  let score = 0;

  // Name
  if (recipe.name?.toLowerCase().includes(kw)) {
    score += FIELD_WEIGHTS.name;
    // Bonus for starts-with
    if (recipe.name.toLowerCase().startsWith(kw)) score += 3;
  }

  // Subtitle
  if (recipe.subtitle?.toLowerCase().includes(kw)) {
    score += FIELD_WEIGHTS.subtitle;
  }

  // Category
  if (recipe.category?.toLowerCase().includes(kw)) {
    score += FIELD_WEIGHTS.category;
  }

  // Difficulty
  if (recipe.difficulty?.toLowerCase().includes(kw)) {
    score += FIELD_WEIGHTS.difficulty;
  }

  // Ingredients
  const ingredientMatches = (recipe.ingredients || []).filter(ing =>
    ing.name.toLowerCase().includes(kw)
  ).length;
  score += ingredientMatches * FIELD_WEIGHTS.ingredient;

  // Description
  if (recipe.description?.toLowerCase().includes(kw)) {
    score += FIELD_WEIGHTS.description;
  }

  // Steps
  const stepMatches = (recipe.steps || []).filter(s =>
    s.description.toLowerCase().includes(kw)
  ).length;
  score += stepMatches * FIELD_WEIGHTS.step;

  return score;
}

/**
 * Search recipes with multi-keyword support and relevance scoring.
 *
 * @param {string} query  – space-separated keywords
 * @param {Array}  recipes – array of recipe objects
 * @param {Object} filters – { category, difficulty, maxMinutes }
 * @returns {Array} – sorted by relevance (highest first)
 */
export function searchRecipes(query, recipes, filters = {}) {
  let results = [...recipes];

  // ── Apply filters first ──
  if (filters.category && filters.category !== '全部') {
    results = results.filter(r => r.category === filters.category);
  }

  if (filters.difficulty && filters.difficulty !== '全部') {
    results = results.filter(r => r.difficulty === filters.difficulty);
  }

  if (filters.maxMinutes) {
    results = results.filter(r => r.totalMinutes <= filters.maxMinutes);
  }

  // ── Apply search ──
  const trimmed = (query || '').trim();
  if (!trimmed) {
    // No search query → apply sort only
    return applySorting(results, filters.sortBy);
  }

  // Split into keywords; all must match
  const keywords = trimmed.split(/\s+/).filter(Boolean);

  const scored = results
    .map(recipe => {
      // Each keyword must contribute at least some score
      let totalScore = 0;
      let allMatch = true;

      for (const kw of keywords) {
        const kwScore = scoreRecipe(kw, recipe);
        if (kwScore === 0) {
          allMatch = false;
          break;
        }
        totalScore += kwScore;
      }

      return { recipe, score: allMatch ? totalScore : 0 };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return applySorting(scored.map(s => s.recipe), filters.sortBy);
}

/**
 * Apply sorting to results.
 */
function applySorting(recipes, sortBy) {
  switch (sortBy) {
    case 'name':
      return [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    case 'time-asc':
      return [...recipes].sort((a, b) => a.totalMinutes - b.totalMinutes);
    case 'newest':
      return [...recipes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    default:
      return recipes; // keep relevance order from search, or original order
  }
}

// ── Search History ──

const HISTORY_KEY = 'bb_search_history';
const MAX_HISTORY = 5;

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return;

  let history = getSearchHistory();
  // Remove duplicate if exists
  history = history.filter(h => h !== trimmed);
  // Prepend
  history.unshift(trimmed);
  // Limit
  history = history.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

// ── Time filter presets ──

export const TIME_FILTERS = [
  { label: '全部', value: null },
  { label: '< 1小時', value: 60 },
  { label: '1-2小時', value: 120 },
  { label: '2小時+', value: Infinity },
];

/**
 * Helper to check if a recipe matches the time filter.
 * For the "2hr+" filter, we want totalMinutes > 120.
 * For others, we want totalMinutes <= value.
 */
export function matchesTimeFilter(recipe, timeFilter) {
  if (!timeFilter || timeFilter.value === null) return true;
  if (timeFilter.value === Infinity) return recipe.totalMinutes > 120;
  if (timeFilter.value === 120) return recipe.totalMinutes > 60 && recipe.totalMinutes <= 120;
  return recipe.totalMinutes <= timeFilter.value;
}
