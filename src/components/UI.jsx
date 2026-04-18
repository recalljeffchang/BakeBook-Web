// src/components/UI.jsx
// Shared UI components — mirrors DesignSystem.swift

import { useState } from 'react';
import { Clock, Thermometer } from 'lucide-react';
import { DIFFICULTIES, formatAmount, formatTime } from '../data/models';

export function TagBadge({ text, bg, color }) {
  return (
    <span className="tag-badge" style={{ background: bg, color }}>
      {text}
    </span>
  );
}

export function StatCard({ value, label, valueColor = '#C8A97E', bg = 'white' }) {
  return (
    <div className="stat-card" style={{ background: bg }}>
      <div className="stat-value" style={{ color: valueColor }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function ProgressBar({ value, color, height = 6 }) {
  return (
    <div className="progress-bar-track" style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%`, background: color, height }} />
    </div>
  );
}

export function StarRating({ rating, onChange, size = 26, interactive = true }) {
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          className={`star ${s <= rating ? '' : 'dim'} ${size < 20 ? 'small' : ''}`}
          style={{ fontSize: size, cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => interactive && onChange && onChange(s)}
        >⭐</span>
      ))}
    </div>
  );
}

export function EmojiCircle({ emoji, bg, size = 40 }) {
  return (
    <div className="emoji-circle" style={{ background: bg, width: size, height: size, borderRadius: size * 0.3, fontSize: size * 0.55 }}>
      {emoji}
    </div>
  );
}

export function PrimaryButton({ label, color, onClick }) {
  return (
    <button className="primary-btn" style={{ background: color }} onClick={onClick}>
      {label}
    </button>
  );
}

export function SectionLabel({ text }) {
  return <div className="section-label">{text}</div>;
}

export function RecipeCardRow({ recipe, onClick }) {
  const catColors = {
    '麵包': '#FEF3E7', '蛋糕': '#FFF0F5',
    '餅乾': '#FFF8E7', '點心': '#F0FFF4', '全部': '#F5F5F5',
  };
  const diff = DIFFICULTIES[recipe.difficulty] || DIFFICULTIES['入門'];
  return (
    <div className="recipe-card-row" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="recipe-card-emoji" style={{ background: catColors[recipe.category] || '#F5F5F5' }}>
        {recipe.emoji}
      </div>
      <div className="recipe-card-info">
        <div className="recipe-card-name">{recipe.name}</div>
        <div className="recipe-card-meta">
          <span><Clock size={11} /> {formatTime(recipe.totalMinutes)}</span>
          <span><Thermometer size={11} /> {recipe.ovenTemp}</span>
        </div>
        <div className="recipe-card-tags">
          <TagBadge text={recipe.difficulty} bg={diff.bg} color={diff.text} />
          {recipe.isUserUploaded && <TagBadge text="我的食譜" bg="#F0EEFF" color="#4A3BA0" />}
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, color = '#C8A97E', children }) {
  return (
    <div className="form-field">
      <div className="form-label" style={{ color }}>{label}</div>
      {children}
    </div>
  );
}

export function ScanProgressView({ status, progress }) {
  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 8 }}>🔍</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#27500A', textAlign: 'center', marginBottom: 8 }}>{status}</div>
      <div className="scan-progress-bar">
        <div className="scan-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export function BackButton({ onClick, color = 'white' }) {
  return (
    <button className="back-btn" onClick={onClick} style={{ color }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

export function Divider() {
  return <div className="divider" />;
}

export function Toggle({ on, onChange }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} type="button">
      <div className="toggle-knob" />
    </button>
  );
}

export function QuantityStepper({ value, onChange, min = 1 }) {
  return (
    <div className="qty-stepper">
      <button className="qty-btn" onClick={() => onChange(Math.max(min, value - 1))} type="button">−</button>
      <span className="qty-value">{value} 件</span>
      <button className="btn" onClick={() => onChange(value + 1)} type="button" style={{ width: 36, height: 36, borderRadius: 18, border: '1.5px solid #C8A97E', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C8A97E' }}>＋</button>
    </div>
  );
}
