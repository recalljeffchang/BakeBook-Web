// src/pages/NewJournal.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from '../utils/uuid';
import { FormField, StarRating, PrimaryButton, Toggle, QuantityStepper } from '../components/UI';

const RECORD_MODES = ['以件計', '以重量計', '兩者皆填'];

export default function NewJournalModal({ onClose }) {
  const { dispatch, recipes } = useApp();
  const [recipeName, setRecipeName] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  const [quantity, setQuantity] = useState(12);
  const [recordMode, setRecordMode] = useState('兩者皆填');
  const [totalWeight, setTotalWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('g');
  const [materialCost, setMaterialCost] = useState('');
  const [saleEnabled, setSaleEnabled] = useState(true);
  const [soldQuantity, setSoldQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [saleNote, setSaleNote] = useState('');

  const revenue = (Number(soldQuantity) || 0) * (Number(unitPrice) || 0);
  const profit = revenue - (Number(materialCost) || 0);
  const margin = revenue > 0 ? Math.round(profit / revenue * 100) : 0;

  const save = () => {
    const entry = {
      id: uuid(),
      recipeName: recipeName || '無名食譜',
      recipeId: recipeId || null,
      date: new Date().toISOString(),
      note, rating, quantity,
      totalWeightGrams: Number(totalWeight) || 0,
      materialCost: Number(materialCost) || 0,
      saleEnabled,
      soldQuantity: Number(soldQuantity) || 0,
      unitPrice: Number(unitPrice) || 0,
      saleNote,
    };
    dispatch({ type: 'ADD_JOURNAL', payload: entry });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: '#9E7B55', padding: '48px 24px 16px', borderRadius: '24px 24px 0 0', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: 10, padding: '4px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>新增烘焙日誌</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>記錄今天的成果</div>
        </div>

        <div style={{ padding: '16px 18px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Basic info */}
          <div className="card">
            <FormField label="食譜名稱" color="#9E7B55">
              <input className="bake-input" placeholder="選擇或輸入食譜名稱" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
            </FormField>
            <div style={{ height: 10 }} />
            <FormField label="烘焙心得" color="#9E7B55">
              <textarea className="bake-input" placeholder="記錄這次的心得..." value={note} onChange={e => setNote(e.target.value)} />
            </FormField>
          </div>

          {/* Output */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7B55', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>產出記錄</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {RECORD_MODES.map(m => (
                <button key={m} onClick={() => setRecordMode(m)} style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                  background: recordMode === m ? '#9E7B55' : '#F7F5F2',
                  color: recordMode === m ? 'white' : '#888',
                }}>{m}</button>
              ))}
            </div>
            {recordMode !== '以重量計' && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>烘焙件數</div>
                <QuantityStepper value={quantity} onChange={setQuantity} />
              </div>
            )}
            {recordMode !== '以件計' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <FormField label="總重量" color="#9E7B55" style={{ flex: 1 }}>
                  <input className="bake-input" type="number" placeholder="重量" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} />
                </FormField>
                <FormField label="單位" color="#9E7B55">
                  <select className="bake-input" value={weightUnit} onChange={e => setWeightUnit(e.target.value)} style={{ width: 70 }}>
                    {['g','kg','oz'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </FormField>
              </div>
            )}
            <FormField label="材料成本（可選）" color="#9E7B55">
              <input className="bake-input" type="number" placeholder="NT$" value={materialCost} onChange={e => setMaterialCost(e.target.value)} />
            </FormField>
          </div>

          {/* Sales */}
          <div className="card">
            <div className="toggle-wrapper" style={{ marginBottom: saleEnabled ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>記錄販售資訊</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>啟用以記錄售出件數與金額</div>
              </div>
              <Toggle on={saleEnabled} onChange={setSaleEnabled} />
            </div>
            {saleEnabled && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <FormField label="售出件數" color="#9E7B55">
                    <input className="bake-input" type="number" placeholder="0" value={soldQuantity} onChange={e => setSoldQuantity(e.target.value)} />
                  </FormField>
                  <FormField label="單件售價（NT$）" color="#9E7B55">
                    <input className="bake-input" type="number" placeholder="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                  </FormField>
                </div>
                <FormField label="販售備註" color="#9E7B55">
                  <input className="bake-input" placeholder="例：農夫市集、送禮、預購" value={saleNote} onChange={e => setSaleNote(e.target.value)} />
                </FormField>
                {/* Preview */}
                <div className="revenue-block" style={{ marginTop: 12 }}>
                  <div className="revenue-row"><span>銷售收入</span><span className="val">NT$ {Math.round(revenue).toLocaleString()}</span></div>
                  <div style={{ height: 1, background: 'rgba(46,125,82,0.2)' }} />
                  <div className="revenue-row"><span>材料成本</span><span className="val" style={{ color: '#C0392B' }}>− NT$ {Math.round(Number(materialCost)||0).toLocaleString()}</span></div>
                  <div style={{ height: 1, background: 'rgba(46,125,82,0.2)' }} />
                  <div className="revenue-row">
                    <span style={{ fontWeight: 900, fontSize: 14, color: '#1C5E3A' }}>利潤估算</span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: profit >= 0 ? '#3D9E6A' : '#E24B4A' }}>NT$ {Math.round(profit).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#3D9E6A', marginTop: 4 }}>
                    每件均價 NT${soldQuantity > 0 ? Math.round(revenue/Number(soldQuantity)) : 0} ・ 利潤率 {margin}%
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rating */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7B55', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>自我評分</div>
            <StarRating rating={rating} onChange={setRating} size={26} />
          </div>

          <PrimaryButton label="儲存日誌 ✓" color="#9E7B55" onClick={save} />
        </div>
      </div>
    </div>
  );
}
