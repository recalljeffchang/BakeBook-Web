// src/pages/Home.jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { greeting, RECIPE_CATEGORIES } from '../data/models';
import { RecipeCardRow } from '../components/UI';

export default function Home({ onNavigate }) {
  const { recipes, recipesForCategory } = useApp();
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = recipesForCategory(category).filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.ingredients?.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="hero-header" style={{ background: '#C8A97E' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>{greeting()}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.25 }}>
          今天要做<br />什麼好料？
        </div>
        <div className="search-bar">
          <Search size={16} color="#aaa" />
          <input
            placeholder="搜尋食譜、材料..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

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

      {/* Section title */}
      <div style={{ padding: '0 20px 12px', fontSize: 18, fontWeight: 900 }}>推薦食譜</div>

      {/* Recipe list */}
      <div className="list-section" style={{ paddingTop: 0 }}>
        {filtered.map(recipe => (
          <RecipeCardRow
            key={recipe.id}
            recipe={recipe}
            onClick={() => onNavigate('recipe-detail', recipe)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', padding: 32, fontSize: 14 }}>
            找不到符合的食譜 🔍
          </div>
        )}
      </div>
    </div>
  );
}
