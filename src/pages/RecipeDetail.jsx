// src/pages/RecipeDetail.jsx
import { useState } from 'react';
import { Clock, Thermometer, Timer as TimerIcon, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatAmount, formatTime } from '../data/models';
import { StatCard, TagBadge, SectionLabel, BackButton, Divider } from '../components/UI';

export default function RecipeDetail({ recipe, onBack, onOpenTimer }) {
  const { checkIngredientSufficiency } = useApp();
  const [baseIdx, setBaseIdx] = useState(0);
  const [sliderValue, setSliderValue] = useState(recipe.ingredients[0]?.amount || 100);

  const baseIng = recipe.ingredients[baseIdx];
  const ratio = baseIng.amount > 0 ? sliderValue / baseIng.amount : 1;

  const scaled = recipe.ingredients.map(ing => ({
    ...ing,
    scaledAmount: ing.amount * ratio,
  }));

  const scaledServings = (recipe.servings * ratio).toFixed(1).replace(/\.0$/, '');

  const flourIng = scaled.find(i => i.name.includes('麵粉'));
  const waterIng = scaled.find(i => i.name.includes('水'));
  const hydrationRate = flourIng && waterIng && flourIng.scaledAmount > 0
    ? Math.round(waterIng.scaledAmount / flourIng.scaledAmount * 100)
    : 0;

  const checks = checkIngredientSufficiency(recipe);
  const hasInsufficient = checks.some(c => !c.sufficient);

  const sliderMin = baseIng.amount * 0.2;
  const sliderMax = baseIng.amount * 3.0;
  const sliderStep = baseIng.unit === 'g' ? 50 : 10;

  return (
    <div className="page" style={{ background: '#F2F0EB' }}>
      {/* Hero */}
      <div style={{ background: '#C8A97E', padding: '0 0 0 0', position: 'relative', minHeight: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 72, textAlign: 'center', paddingTop: 44, paddingBottom: 16 }}>{recipe.emoji}</div>
        <div style={{ position: 'absolute', top: `calc(env(safe-area-inset-top, 0px) + 52px)`, left: 16 }}>
          <BackButton onClick={onBack} />
        </div>
      </div>

      {/* Detail body */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{recipe.name}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{recipe.subtitle}</div>
        </div>

        {/* Stats */}
        <div className="stat-row">
          <StatCard value={formatTime(recipe.totalMinutes)} label="總時間" />
          <StatCard value={recipe.ovenTemp} label="烤溫" />
          <StatCard value={`${recipe.bakeMinutes}分`} label="烘烤" />
          <StatCard value={`${scaledServings}份`} label="份量" />
        </div>

        {/* Insufficient banner */}
        {hasInsufficient && (
          <div className="insufficient-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#791F1F', marginBottom: 6 }}>
              <AlertTriangle size={14} /> 食材存量不足
            </div>
            {checks.filter(c => !c.sufficient).map(c => (
              <div key={c.name} style={{ fontSize: 12, color: '#A32D2D' }}>
                • {c.name} 需要 {formatAmount(c.required)}{c.unit}，剩 {formatAmount(c.available)}{c.unit}
              </div>
            ))}
          </div>
        )}

        {/* Ingredients section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5a3e28' }}>準備材料</div>
            <TagBadge text={`基準：${Math.round(sliderValue)}${baseIng.unit} ${baseIng.name}`} bg="#FEF3E7" color="#9E6A2A" />
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>以哪項食材為基準？</div>

          {/* Base ingredient selector */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {recipe.ingredients.map((ing, idx) => (
              <button
                key={ing.id}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: baseIdx === idx ? '#C8A97E' : '#F7F5F2',
                  color: baseIdx === idx ? 'white' : '#888',
                  fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
                }}
                onClick={() => { setBaseIdx(idx); setSliderValue(ing.amount); }}
              >
                {ing.name}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{baseIng.name}用量</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#C8A97E' }}>{Math.round(sliderValue)}{baseIng.unit}</div>
            </div>
            <input
              type="range" min={sliderMin} max={sliderMax} step={sliderStep}
              value={sliderValue}
              onChange={e => setSliderValue(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
              拖動滑桿，所有材料自動等比調整
            </div>
          </div>

          <Divider />

          {/* Ingredient table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#888', padding: '6px 0 10px' }}>
            <span style={{ flex: 1 }}>材料</span>
            <span style={{ width: 60, textAlign: 'right' }}>基準量</span>
            <span style={{ width: 70, textAlign: 'right' }}>調整後</span>
          </div>
          {recipe.ingredients.map((ing, idx) => {
            const s = scaled[idx];
            const isBase = idx === baseIdx;
            return (
              <div key={ing.id}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: isBase ? '#E8963A' : '#C8A97E', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: isBase ? 700 : 600, color: isBase ? '#9E6A2A' : '#1a1a1a' }}>{ing.name}</span>
                    {isBase && <TagBadge text="基準" bg="#FEF3E7" color="#9E6A2A" />}
                  </div>
                  <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#888' }}>{formatAmount(ing.amount)}{ing.unit}</span>
                  <span style={{ width: 70, textAlign: 'right', fontSize: 14, fontWeight: 900, color: isBase ? '#E8963A' : '#C8A97E' }}>
                    {formatAmount(s.scaledAmount)}{ing.unit}
                  </span>
                </div>
                <Divider />
              </div>
            );
          })}
          {hydrationRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#888' }}>水合率</span>
              <span style={{ fontWeight: 700, color: '#C8A97E' }}>{hydrationRate}%</span>
            </div>
          )}
        </div>

        {/* Steps */}
        <div>
          <SectionLabel text="製作步驟" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {recipe.steps.map(step => (
              <div key={step.id} className="step-card">
                <div className="step-num">{step.order}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{step.description}</div>
                  {step.timerMinutes && (
                    <button
                      style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3E7', color: '#9E6A2A', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => onOpenTimer(step.timerMinutes)}
                    >
                      <TimerIcon size={12} /> 設定 {step.timerMinutes >= 60 ? `${Math.floor(step.timerMinutes/60)}h${step.timerMinutes%60||''}` : `${step.timerMinutes}min`} 計時
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
