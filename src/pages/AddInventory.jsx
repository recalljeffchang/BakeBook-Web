// src/pages/AddInventory.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from '../utils/uuid';
import { INGREDIENT_CATEGORIES, CATEGORY_EMOJI } from '../data/models';
import { FormField, PrimaryButton, ScanProgressView } from '../components/UI';

const SCAN_STEPS = [
  [0.0,  '辨識食材包裝中...'],
  [0.3,  '讀取重量與規格...'],
  [0.6,  '辨識價格與品牌...'],
  [0.85, '查詢購置地點...'],
  [1.0,  '辨識完成！'],
];

export default function AddInventoryModal({ onClose }) {
  const { dispatch } = useApp();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('粉類');
  const [currentStock, setCurrentStock] = useState('');
  const [unit, setUnit] = useState('g');
  const [totalPieces, setTotalPieces] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [minimumThreshold, setMinimumThreshold] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [scanMode, setScanMode] = useState('idle'); // idle | scanning | done
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState(SCAN_STEPS[0][1]);

  const thresholdDiff = (Number(currentStock) || 0) - (Number(minimumThreshold) || 0);
  const isOk = thresholdDiff >= 0;

  const startScan = () => {
    setScanMode('scanning');
    setScanProgress(0);
    let i = 0;
    const interval = setInterval(() => {
      if (i < SCAN_STEPS.length) {
        setScanProgress(SCAN_STEPS[i][0]);
        setScanStatus(SCAN_STEPS[i][1]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setScanMode('done');
          setName('高筋麵粉');
          setBrand('水手牌');
          setCurrentStock('2000');
          setUnit('g');
          setTotalPieces('2');
          setPurchasePrice('90');
          setPurchaseLocation('全聯福利中心');
          setMinimumThreshold('500');
          setCategory('粉類');
        }, 300);
      }
    }, 550);
  };

  const save = () => {
    const stock = Number(currentStock) || 0;
    const item = {
      id: uuid(),
      name: name || '新食材',
      brand, category,
      emoji: CATEGORY_EMOJI[category] || '🧺',
      currentStock: stock,
      unit,
      totalPieces: Number(totalPieces) || 1,
      purchasePrice: Number(purchasePrice) || 0,
      purchaseLocation,
      minimumThreshold: Number(minimumThreshold) || 0,
      initialStock: stock,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      usageLog: [],
    };
    dispatch({ type: 'ADD_INVENTORY', payload: item });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: '#2E7D52', padding: '48px 24px 16px', borderRadius: '24px 24px 0 0', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: 10, padding: '4px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>新增食材</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>手動填寫或拍照辨識</div>
        </div>

        <div style={{ padding: '16px 18px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Scan card */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>拍照辨識食材</div>
            {scanMode === 'idle' && (
              <>
                <div className="scan-zone" onClick={startScan}>
                  <div style={{ fontSize: 30 }}>📷</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1C5E3A' }}>拍攝食材包裝或收據</div>
                  <div style={{ fontSize: 12, color: '#888' }}>AI 自動辨識品名、重量、價格</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {['📷 即時拍照', '🖼️ 選取照片', '🧾 掃描收據'].map(lbl => (
                    <button key={lbl} onClick={startScan} style={{ flex: 1, padding: '9px 0', background: '#EAFBF0', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#1C5E3A', cursor: 'pointer', fontFamily: 'inherit' }}>{lbl}</button>
                  ))}
                </div>
              </>
            )}
            {scanMode === 'scanning' && (
              <div style={{ padding: '16px 0' }}>
                <ScanProgressView status={scanStatus} progress={scanProgress} />
              </div>
            )}
            {scanMode === 'done' && (
              <div style={{ background: '#EAFBF0', borderRadius: 14, padding: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3D9E6A' }} />
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#1C5E3A' }}>辨識完成</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#3D9E6A' }}>✓ 確認無誤</span>
                </div>
                {[['食材名稱', '高筋麵粉（水手牌）'], ['淨重', '1000g'], ['件數', '2 包'], ['價格', 'NT$ 90'], ['購置地點', '全聯福利中心']].map(([field, val]) => (
                  <div key={field}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#27500A', width: 64 }}>{field}</span>
                      <span style={{ flex: 1 }}>{val}</span>
                    </div>
                    <div className="divider" />
                  </div>
                ))}
                <button onClick={() => setScanMode('idle')} style={{ fontSize: 12, fontWeight: 700, color: '#2E7D52', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>重新掃描</button>
              </div>
            )}
          </div>

          {/* Basic */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FormField label="食材名稱" color="#2E7D52">
              <input className="bake-input" placeholder="例：高筋麵粉" value={name} onChange={e => setName(e.target.value)} />
            </FormField>
            <FormField label="品牌（可選）" color="#2E7D52">
              <input className="bake-input" placeholder="例：水手牌" value={brand} onChange={e => setBrand(e.target.value)} />
            </FormField>
            <div style={{ display: 'flex', gap: 8 }}>
              <FormField label="現有存量" color="#2E7D52">
                <input className="bake-input" type="number" placeholder="數量" value={currentStock} onChange={e => setCurrentStock(e.target.value)} />
              </FormField>
              <FormField label="單位" color="#2E7D52">
                <select className="bake-input" value={unit} onChange={e => setUnit(e.target.value)} style={{ width: 74 }}>
                  {['g','kg','ml','L','顆','包','罐'].map(u => <option key={u}>{u}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          {/* Purchase */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FormField label="購置地點" color="#2E7D52">
              <input className="bake-input" placeholder="例：全聯、家樂福" value={purchaseLocation} onChange={e => setPurchaseLocation(e.target.value)} />
            </FormField>
            <div style={{ display: 'flex', gap: 8 }}>
              <FormField label="購買價格（NT$）" color="#2E7D52">
                <input className="bake-input" type="number" placeholder="總金額" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
              </FormField>
              <FormField label="效期（可選）" color="#2E7D52">
                <input className="bake-input" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </FormField>
            </div>
          </div>

          {/* Threshold */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>補購門檻設定</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>當存量低於此數值時，自動發出補購提醒</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input className="bake-input" type="number" placeholder="門檻值" value={minimumThreshold} onChange={e => setMinimumThreshold(e.target.value)} style={{ flex: 1 }} />
              <span style={{ color: '#888', flexShrink: 0 }}>{unit}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isOk ? '#1C5E3A' : '#E24B4A', padding: 10, background: isOk ? '#EAFBF0' : '#FCEBEB', borderRadius: 10 }}>
              {isOk ? `存量充足 ✓ 距補購門檻還有 ${thresholdDiff}${unit}` : `⚠ 低於門檻，需補購 ${-thresholdDiff}${unit} 以上`}
            </div>
          </div>

          {/* Category */}
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>食材分類</div>
            <div className="grid-3">
              {INGREDIENT_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '8px 0', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  background: category === cat ? '#2E7D52' : '#F7F5F2',
                  color: category === cat ? 'white' : '#888',
                }}>
                  {CATEGORY_EMOJI[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          <PrimaryButton label="儲存食材 ✓" color="#2E7D52" onClick={save} />
        </div>
      </div>
    </div>
  );
}
