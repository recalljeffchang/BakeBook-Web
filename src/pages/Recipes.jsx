// src/pages/Recipes.jsx
import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { RecipeCardRow } from '../components/UI';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { RECIPE_CATEGORIES } from '../data/models';
import {
  searchRecipes,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  TIME_FILTERS,
  matchesTimeFilter,
} from '../utils/searchEngine';

const DIFFICULTY_OPTIONS = ['全部', '入門', '中等', '進階'];
const SORT_OPTIONS = [
  { label: '預設', value: '' },
  { label: '最新', value: 'newest' },
  { label: '名稱', value: 'name' },
  { label: '時間短→長', value: 'time-asc' },
];

const SUGGESTIONS = ['麵包', '草莓', '蛋糕', '抹茶', '奶油'];

export default function Recipes({ onNavigate }) {
  const { recipes } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [showFilters, setShowFilters] = useState(false);
  const [difficulty, setDifficulty] = useState('全部');
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS[0]);
  const [sortBy, setSortBy] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState(getSearchHistory);
  const inputRef = useRef(null);

  const hasActiveFilters = difficulty !== '全部' || timeFilter.value !== null || sortBy !== '';

  // Pre-filter by time since searchEngine handles category & difficulty
  let pool = recipes;
  if (timeFilter.value !== null) {
    pool = pool.filter(r => matchesTimeFilter(r, timeFilter));
  }

  const filtered = searchRecipes(search, pool, {
    category,
    difficulty,
    sortBy,
  });

  const commitSearch = useCallback(() => {
    if (search.trim()) {
      addSearchHistory(search.trim());
      setHistory(getSearchHistory());
    }
    setIsFocused(false);
  }, [search]);

  const handleHistoryClick = (term) => {
    setSearch(term);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleSuggestionClick = (term) => {
    setSearch(term);
    addSearchHistory(term);
    setHistory(getSearchHistory());
  };

  const clearAll = () => {
    setSearch('');
    setCategory('全部');
    setDifficulty('全部');
    setTimeFilter(TIME_FILTERS[0]);
    setSortBy('');
    inputRef.current?.focus();
  };

  return (
    <div className="page">
      {/* Header with search */}
      <div className="recipes-header">
        <div className="recipes-header-row">
          <div className="recipes-title">食譜</div>
          <button
            className={`filter-toggle-btn ${showFilters || hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal size={13} />
            篩選
          </button>
        </div>

        {/* Search bar */}
        <div className="search-bar" style={{ margin: 0, background: '#F7F5F2' }}>
          <Search size={16} color="#aaa" />
          <input
            ref={inputRef}
            placeholder="搜尋食譜名稱、材料、步驟..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={e => { if (e.key === 'Enter') commitSearch(); }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
            >
              <X size={14} color="#aaa" />
            </button>
          )}
        </div>
      </div>

      {/* Search History */}
      {isFocused && !search && history.length > 0 && (
        <div className="search-history">
          <div className="search-history-header">
            <span className="search-history-title">🕐 最近搜尋</span>
            <button className="search-history-clear" onClick={handleClearHistory}>清除</button>
          </div>
          <div className="search-history-chips">
            {history.map((term, i) => (
              <button key={i} className="history-chip" onClick={() => handleHistoryClick(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category pills */}
      <div className="pill-row">
        {RECIPE_CATEGORIES.map(cat => (
          <button
            key={cat}
            className="pill"
            style={{
              background: category === cat ? '#C8A97E' : 'white',
              color: category === cat ? 'white' : '#5a4a38',
            }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <div className="filter-group-label">難度</div>
            <div className="filter-chips">
              {DIFFICULTY_OPTIONS.map(d => (
                <button
                  key={d}
                  className={`filter-chip ${difficulty === d ? 'active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="filter-group-label">時間</div>
            <div className="filter-chips">
              {TIME_FILTERS.map(tf => (
                <button
                  key={tf.label}
                  className={`filter-chip ${timeFilter.label === tf.label ? 'active' : ''}`}
                  onClick={() => setTimeFilter(tf)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <div className="filter-group-label">排序</div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Result count */}
      {(search || hasActiveFilters) && (
        <div className="result-count">
          <span className="result-count-badge">找到 {filtered.length} 筆食譜</span>
          <button className="clear-search-btn" onClick={clearAll}>
            <X size={12} /> 清除全部
          </button>
        </div>
      )}

      {/* Recipe list */}
      <div className="list-section" style={{ paddingTop: 4 }}>
        {filtered.map(r => (
          <RecipeCardRow
            key={r.id}
            recipe={r}
            onClick={() => onNavigate('recipe-detail', r.id)}
            highlightQuery={search}
          />
        ))}
        {filtered.length === 0 && (
          <div className="empty-search">
            <div className="empty-search-emoji">📖</div>
            <div className="empty-search-title">找不到符合的食譜</div>
            <div className="empty-search-hint">
              {search
                ? `沒有符合「${search}」的結果，試試其他關鍵字？`
                : '調整篩選條件看看更多食譜'}
            </div>
            <div className="empty-search-suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fab"
        style={{ background: '#C8A97E' }}
        onClick={() => onNavigate('upload-recipe')}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
