// src/pages/RecipeDetail.jsx
import { useState } from 'react';
import { Timer as TimerIcon, AlertTriangle, Camera, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatAmount, formatTime } from '../data/models';
import { StatCard, TagBadge, SectionLabel, BackButton, Divider } from '../components/UI';
import NewJournalModal from './NewJournal';
import NutritionLabel from '../components/NutritionLabel';
import { calculateNutritionFromIngredients } from '../utils/nutrition';
import { v4 as uuid } from '../utils/uuid';

const UNITS = ['g', 'ml', '顆', 'kg', '匙', '杯'];

export default function RecipeDetail({ recipeId, onBack, onOpenTimer }) {
  const { checkIngredientSufficiency, dispatch, recipes } = useApp();

  // ── 新增食材 state ──
  const [showAddIng, setShowAddIng] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngAmount, setNewIngAmount] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('g');
  const [newIngGroup, setNewIngGroup] = useState('');

  // ── 新增步驟 state ──
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepDesc, setNewStepDesc] = useState('');
  const [newStepTimer, setNewStepTimer] = useState('');

  // --- Edit ingredient state ---
  const [editingIngId, setEditingIngId] = useState(null);
  const [editIngName, setEditIngName] = useState('');
  const [editIngAmount, setEditIngAmount] = useState('');
  const [editIngUnit, setEditIngUnit] = useState('g');
  const [editIngGroup, setEditIngGroup] = useState('');

  // --- Edit step state ---
  const [editingStepId, setEditingStepId] = useState(null);
  const [editStepDesc, setEditStepDesc] = useState('');
  const [editStepTimer, setEditStepTimer] = useState('');

  const [baseIdx, setBaseIdx] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [packages, setPackages] = useState(2);
  const [piecesPerPkg, setPiecesPerPkg] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 從 Context 取得最新 recipe（確保 UPDATE_RECIPE 後畫面卻時更新）
  const recipe = recipes.find(r => r.id === recipeId);

  // ── Derived values ──
  const safeBaseIdx = recipe ? Math.min(baseIdx, Math.max(0, recipe.ingredients.length - 1)) : 0;
  const baseIng = recipe?.ingredients[safeBaseIdx] || { name: '', amount: 100, unit: 'g' };
  const sliderInitial = recipe?.ingredients[0]?.amount || 100;
  const [sliderValue, setSliderValue] = useState(sliderInitial);
  const ratio = baseIng.amount > 0 ? sliderValue / baseIng.amount : 1;

  // 必須在所有 hooks 後才能做 early return
  if (!recipe) return null;

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

  const sliderMin = baseIng.amount * 0.2;
  const sliderMax = baseIng.amount * 3.0;
  const sliderStep = baseIng.unit === 'g' ? 50 : 10;

  const checks = checkIngredientSufficiency(recipe);
  const hasInsufficient = checks.some(c => !c.sufficient);

  // ── Handlers ──
  const handleAddIngredient = () => {
    if (!newIngName.trim() || !newIngAmount) return;
    const updated = {
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { id: uuid(), name: newIngName.trim(), amount: Number(newIngAmount), unit: newIngUnit, isBase: false, group: newIngGroup.trim() },
      ],
    };
    dispatch({ type: 'UPDATE_RECIPE', payload: updated });
    setNewIngName(''); setNewIngAmount(''); setNewIngUnit('g'); setNewIngGroup(''); setShowAddIng(false);
  };

  const handleDeleteIngredient = (ingId) => {
    const updated = { ...recipe, ingredients: recipe.ingredients.filter(i => i.id !== ingId) };
    dispatch({ type: 'UPDATE_RECIPE', payload: updated });
  };

  const handleEditIngredient = (ing) => {
    setEditingIngId(ing.id);
    setEditIngName(ing.name);
    setEditIngAmount(String(ing.amount));
    setEditIngUnit(ing.unit);
    setEditIngGroup(ing.group || '');
  };

  const handleUpdateIngredient = () => {
    if (!editIngName.trim() || !editIngAmount) return;
    const updated = {
      ...recipe,
      ingredients: recipe.ingredients.map(i =>
        i.id === editingIngId
          ? { ...i, name: editIngName.trim(), amount: Number(editIngAmount), unit: editIngUnit, group: editIngGroup.trim() }
          : i
      ),
    };
    dispatch({ type: 'UPDATE_RECIPE', payload: updated });
    setEditingIngId(null);
  };

  const handleAddStep = () => {
    if (!newStepDesc.trim()) return;
    const updated = {
      ...recipe,
      steps: [
        ...recipe.steps,
        { id: uuid(), order: recipe.steps.length + 1, description: newStepDesc.trim(), timerMinutes: Number(newStepTimer) || null },
      ],
    };
    dispatch({ type: 'UPDATE_RECIPE', payload: updated });
    setNewStepDesc(''); setNewStepTimer(''); setShowAddStep(false);
  };

  const handleDeleteStep = (stepId) => {
    const newSteps = recipe.steps
      .filter(s => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    dispatch({ type: 'UPDATE_RECIPE', payload: { ...recipe, steps: newSteps } });
  };

  const handleEditStep = (step) => {
    setEditingStepId(step.id);
    setEditStepDesc(step.description);
    setEditStepTimer(step.timerMinutes ? String(step.timerMinutes) : '');
  };

  const handleUpdateStep = () => {
    if (!editStepDesc.trim()) return;
    const updated = {
      ...recipe,
      steps: recipe.steps.map(s =>
        s.id === editingStepId
          ? { ...s, description: editStepDesc.trim(), timerMinutes: Number(editStepTimer) || null }
          : s
      ),
    };
    dispatch({ type: 'UPDATE_RECIPE', payload: updated });
    setEditingStepId(null);
  };

  const handleDeleteRecipe = () => {
    dispatch({ type: 'DELETE_RECIPE', payload: recipe.id });
    onBack();
  };


  return (
    <div className="page" style={{ background: '#F2F0EB' }}>
      {/* 刪除確認彈窗 */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px', width: '100%', maxWidth: 480,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
              刪除「{recipe.name}」？
            </div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              此操作無法復原。該食譜的食材、步驟與營養資訊將被永久刪除。
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: '13px 0', border: '1.5px solid #ddd', borderRadius: 12, background: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteRecipe}
                style={{ flex: 1, padding: '13px 0', border: 'none', borderRadius: 12, background: '#E24B4A', color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: '#C8A97E', padding: '0 0 0 0', position: 'relative', minHeight: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 72, textAlign: 'center', paddingTop: 44, paddingBottom: 16 }}>{recipe.emoji}</div>
        <div style={{ position: 'absolute', top: `calc(env(safe-area-inset-top, 0px) + 52px)`, left: 16 }}>
          <BackButton onClick={onBack} />
        </div>
        {/* 删除按钮（所有食譜均可刪除） */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            position: 'absolute',
            top: ` calc(env(safe-area-inset-top, 0px) + 52px) `,
            right: 16,
            background: 'rgba(226,75,74,0.85)',
            border: 'none', color: 'white',
            borderRadius: 10, padding: '6px 14px',
            fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <Trash2 size={13} /> 刪除
        </button>

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
          {(() => {
            const allGroups = [...new Set(recipe.ingredients.map(i => i.group || ''))];
            return allGroups.map(groupName => {
              const groupItems = recipe.ingredients
                .map((ing, idx) => ({ ing, idx }))
                .filter(({ ing }) => (ing.group || '') === groupName);
              return (
                <div key={groupName || '__no_group__'}>
                  {groupName && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#9E6A2A', background: '#FEF3E7', padding: '3px 10px', borderRadius: 6, marginTop: 10, marginBottom: 4 }}>
                      {groupName}
                    </div>
                  )}
                  {groupItems.map(({ ing, idx }) => {
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
                </div>
              );
            });
          })()}
          {hydrationRate > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#888' }}>水合率</span>
              <span style={{ fontWeight: 700, color: '#C8A97E' }}>{hydrationRate}%</span>
            </div>
          )}

          {recipe.ingredients.length === 0 && (
            <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '12px 0' }}>尚未新增任何食材</div>
          )}

          <Divider />

          {/* ── 刪除食材按鈕 ── */}
          {recipe.ingredients.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {(() => {
                const editGroups = [...new Set(recipe.ingredients.map(i => i.group || ''))];
                return editGroups.map(groupName => {
                  const groupItems = recipe.ingredients.filter(i => (i.group || '') === groupName);
                  return (
                    <div key={groupName || '__no_group__'}>
                      {groupName && (
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9E6A2A', background: '#FEF3E7', padding: '3px 10px', borderRadius: 6, marginBottom: 4, marginTop: 8 }}>
                          {groupName}
                        </div>
                      )}
                      {groupItems.map(ing => (
                        <div key={ing.id}>
                          {editingIngId === ing.id ? (
                    <div style={{ background: '#FEF3E7', borderRadius: 10, padding: 10, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input className="bake-input" value={editIngName} onChange={e => setEditIngName(e.target.value)} placeholder="食材名稱" />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="bake-input" type="number" value={editIngAmount} onChange={e => setEditIngAmount(e.target.value)} placeholder="數量" style={{ flex: 1 }} />
                        <select className="bake-input" value={editIngUnit} onChange={e => setEditIngUnit(e.target.value)} style={{ width: 70 }}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <datalist id="ing-groups-edit">
                        {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                      <input className="bake-input" list="ing-groups-edit" placeholder="分組（例：湯種）" value={editIngGroup} onChange={e => setEditIngGroup(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleUpdateIngredient} style={{ flex: 1, padding: '7px 0', background: '#C8A97E', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>儲存</button>
                        <button onClick={() => setEditingIngId(null)} style={{ flex: 1, padding: '7px 0', background: '#F0EDE8', border: 'none', borderRadius: 8, color: '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
                        <button onClick={() => { handleDeleteIngredient(ing.id); setEditingIngId(null); }} style={{ padding: '7px 10px', background: '#FCEBEB', border: 'none', borderRadius: 8, color: '#E24B4A', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>刪除</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', borderRadius: 8, cursor: 'pointer' }} onClick={() => handleEditIngredient(ing)}>
                      <span style={{ fontSize: 13, color: '#555' }}>{ing.name} {ing.amount}{ing.unit}</span>
                      <span style={{ fontSize: 11, color: '#C8A97E', fontWeight: 600 }}>編輯</span>
                    </div>
                  )}
                </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* ── 新增食材表單 ── */}
          {showAddIng ? (
            <div style={{ marginTop: 12, background: '#FEF3E7', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9E6A2A', marginBottom: 2 }}>新增食材</div>
              <input
                className="bake-input"
                placeholder="食材名稱，例：高筋麵粉"
                value={newIngName}
                onChange={e => setNewIngName(e.target.value)}
              />
              <datalist id="ing-groups-add">
                {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <input className="bake-input" list="ing-groups-add" placeholder="分組（選填，例：湯種、主麵團）" value={newIngGroup} onChange={e => setNewIngGroup(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="bake-input"
                  type="number"
                  placeholder="用量"
                  value={newIngAmount}
                  onChange={e => setNewIngAmount(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  className="bake-input"
                  value={newIngUnit}
                  onChange={e => setNewIngUnit(e.target.value)}
                  style={{ width: 70 }}
                >
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddIngredient}
                  style={{ flex: 1, padding: '9px 0', background: '#C8A97E', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  確認新增
                </button>
                <button
                  onClick={() => { setShowAddIng(false); setNewIngName(''); setNewIngAmount(''); }}
                  style={{ flex: 1, padding: '9px 0', background: '#F0EDE8', border: 'none', borderRadius: 10, color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddIng(true)}
              style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#FEF3E7', border: '1.5px dashed #C8A97E', borderRadius: 10, color: '#9E6A2A', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={15} /> 新增食材
            </button>
          )}
        </div>

        {/* Steps */}
        <div>
          <SectionLabel text="製作步驟" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {recipe.steps.length === 0 && (
            <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, padding: '12px 0' }}>尚未新增任何步驟</div>
          )}
          {recipe.steps.map(step => (
            <div key={step.id}>
              {editingStepId === step.id ? (
                <div style={{ background: '#F5F0FF', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5a3e9e' }}>修改步驟 #{step.order}</div>
                  <textarea
                    className="bake-input"
                    rows={3}
                    value={editStepDesc}
                    onChange={e => setEditStepDesc(e.target.value)}
                    placeholder="步驟說明"
                  />
                  <input
                    className="bake-input"
                    type="number"
                    placeholder="計時分鐘（選填）"
                    value={editStepTimer}
                    onChange={e => setEditStepTimer(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleUpdateStep} style={{ flex: 1, padding: '7px 0', background: '#7B5EA7', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>儲存</button>
                    <button onClick={() => setEditingStepId(null)} style={{ flex: 1, padding: '7px 0', background: '#F0EDE8', border: 'none', borderRadius: 8, color: '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
                    <button onClick={() => { handleDeleteStep(step.id); setEditingStepId(null); }} style={{ padding: '7px 10px', background: '#FCEBEB', border: 'none', borderRadius: 8, color: '#E24B4A', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>刪除</button>
                  </div>
                </div>
              ) : (
                <div className="step-card" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleEditStep(step)}>
                  <div className="step-num">{step.order}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{step.description}</div>
                    {step.timerMinutes && (
                      <button
                        style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3E7', color: '#9E6A2A', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={e => { e.stopPropagation(); onOpenTimer(step.timerMinutes); }}
                      >
                        <TimerIcon size={12} /> 設定 {step.timerMinutes >= 60 ? `${Math.floor(step.timerMinutes/60)}h${step.timerMinutes%60 ? step.timerMinutes%60 : ""}` : `${step.timerMinutes}min`} 計時
                      </button>
                    )}
                  </div>
                  <span style={{ position: 'absolute', top: 8, right: 6, fontSize: 11, color: '#C8A97E', fontWeight: 600 }}>編輯</span>
                </div>
              )}
            </div>
          ))}

          {/* ── 新增步驟表單 ── */}
          {showAddStep ? (
            <div style={{ background: '#F5F0FF', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5a3e9e', marginBottom: 2 }}>新增步驟 #{recipe.steps.length + 1}</div>
              <textarea
                className="bake-input"
                placeholder="步驟說明，例：將麵粉過篩後加入砂糖拌勻"
                value={newStepDesc}
                onChange={e => setNewStepDesc(e.target.value)}
                rows={3}
              />
              <input
                className="bake-input"
                type="number"
                placeholder="計時分鐘（選填，例：30）"
                value={newStepTimer}
                onChange={e => setNewStepTimer(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddStep}
                  style={{ flex: 1, padding: '9px 0', background: '#7B5EA7', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  確認新增
                </button>
                <button
                  onClick={() => { setShowAddStep(false); setNewStepDesc(''); setNewStepTimer(''); }}
                  style={{ flex: 1, padding: '9px 0', background: '#F0EDE8', border: 'none', borderRadius: 10, color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStep(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#F0EEFF', border: '1.5px dashed #7B5EA7', borderRadius: 10, color: '#5a3e9e', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus size={15} /> 新增步驟
            </button>
          )}
          </div>
        </div>

        {/* Nutrition Label Section */}
        {(() => {
          // Scale ingredients to ONE PACKAGE's worth (total / packages)
          const perPkgIngredients = recipe.ingredients.map((ing, idx) => ({
            ...ing,
            amount: scaled[idx].scaledAmount / packages,
          }));
          // Each package contains piecesPerPkg servings
          const nutritionData = calculateNutritionFromIngredients(perPkgIngredients, piecesPerPkg);
          if (!nutritionData) return null;

          const totalRawWeight = Math.round(recipe.ingredients.reduce((sum, ing, idx) => {
            const amt = scaled[idx].scaledAmount;
            if (ing.unit === 'g' || ing.unit === 'ml') return sum + amt;
            if (ing.unit === '顆') return sum + amt * 50;
            if (ing.unit === 'kg') return sum + amt * 1000;
            return sum;
          }, 0));
          const perPkgWeight = Math.round(totalRawWeight / packages);
          const totalPieces = packages * piecesPerPkg;

          return (
            <div className="card" style={{ overflow: 'hidden' }}>
              <button
                onClick={() => setShowNutrition(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>營養成份表</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>依據食藥署「包裝食品營養標示應遵行事項」計算</div>
                  </div>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showNutrition ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
                </div>
              </button>

              {showNutrition && (
                <div style={{ marginTop: 14 }}>
                  {/* Portioning Controls */}
                  <div style={{ background: '#FEF3E7', borderRadius: 12, padding: 14, marginBottom: 14, border: '1px solid #F0D9B5' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#9E6A2A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      📦 分裝設定
                      <span style={{ fontSize: 10, fontWeight: 500, color: '#B08A5A' }}>（營養標示以每包計算）</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9E6A2A', marginBottom: 5 }}>分裝份數</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => setPackages(Math.max(1, packages - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #C8A97E', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#9E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <input type="number" min="1" value={packages} onChange={e => setPackages(Math.max(1, Number(e.target.value) || 1))} style={{ width: 48, textAlign: 'center', padding: '5px 0', border: '1.5px solid #C8A97E', borderRadius: 8, fontSize: 15, fontWeight: 900, color: '#9E6A2A', fontFamily: 'inherit', background: 'white' }} />
                          <button onClick={() => setPackages(packages + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #C8A97E', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#9E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          <span style={{ fontSize: 12, color: '#B08A5A' }}>包</span>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9E6A2A', marginBottom: 5 }}>每包個數</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => setPiecesPerPkg(Math.max(1, piecesPerPkg - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #C8A97E', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#9E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <input type="number" min="1" value={piecesPerPkg} onChange={e => setPiecesPerPkg(Math.max(1, Number(e.target.value) || 1))} style={{ width: 48, textAlign: 'center', padding: '5px 0', border: '1.5px solid #C8A97E', borderRadius: 8, fontSize: 15, fontWeight: 900, color: '#9E6A2A', fontFamily: 'inherit', background: 'white' }} />
                          <button onClick={() => setPiecesPerPkg(piecesPerPkg + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #C8A97E', background: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#9E6A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          <span style={{ fontSize: 12, color: '#B08A5A' }}>個</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, padding: '8px 10px', background: 'white', borderRadius: 8, fontSize: 12, color: '#5a4a38', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>總產出 <strong>{totalPieces}</strong> 個（{packages} 包 × {piecesPerPkg} 個）</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, color: '#9E6A2A', fontWeight: 700 }}>
                        <span>每包淨重 {perPkgWeight}g</span>
                        <span>每個 {Math.round(perPkgWeight / piecesPerPkg)}g</span>
                      </div>
                    </div>
                  </div>

                  <NutritionLabel
                    data={nutritionData}
                    recipeName={recipe.name}
                    ingredients={recipe.ingredients.map(i => i.name).join('、')}
                    servings={piecesPerPkg}
                    netWeight={perPkgWeight}
                  />
                </div>
              )}
            </div>
          );
        })()}
        {/* Record bake journal button */}
        <button
          onClick={() => setShowJournal(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px 0', border: 'none', borderRadius: 14,
            background: 'linear-gradient(135deg, #9E7B55, #C8A97E)',
            color: 'white', fontWeight: 900, fontSize: 15,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(158,123,85,0.35)',
          }}
        >
          <Camera size={18} strokeWidth={2.5} />
          記錄烘焙日誌
        </button>
      </div>

      {/* Journal modal */}
      {showJournal && (
        <NewJournalModal
          onClose={() => setShowJournal(false)}
          initialRecipe={recipe}
        />
      )}
    </div>
  );
}
