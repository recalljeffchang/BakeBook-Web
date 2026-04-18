// src/pages/Recipes.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RecipeCardRow } from '../components/UI';
import { Plus } from 'lucide-react';

export default function Recipes({ onNavigate }) {
  const { recipes } = useApp();

  return (
    <div className="page">
      <div style={{ padding: '60px 20px 12px', fontWeight: 900, fontSize: 28 }}>食譜</div>
      <div className="list-section" style={{ paddingTop: 4 }}>
        {recipes.map(r => (
          <RecipeCardRow
            key={r.id}
            recipe={r}
            onClick={() => onNavigate('recipe-detail', r)}
          />
        ))}
      </div>
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
