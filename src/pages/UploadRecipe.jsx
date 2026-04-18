// src/pages/UploadRecipe.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from '../utils/uuid';
import { RECIPE_CATEGORIES, DIFFICULTIES } from '../data/models';
import { FormField, PrimaryButton, ScanProgressView, BackButton } from '../components/UI';

const SCAN_STEPS = [
  [0.0,  '分析圖片構圖...'],
  [0.25, '辨識食材清單...'],
  [0.5,  '讀取烘焙步驟...'],
  [0.75, '整合食譜資料...'],
  [1.0,  '辨識完成！'],
];

const AI_RESULT = {
  name: '伯爵茶磅蛋糕',
  subtitle: '伯爵茶香・濃郁奶油',
  category: '蛋糕',
  difficulty: '入門',
  emoji: '🍰',
  totalMinutes: 75,
  ovenTemp: '170°C',
  bakeMinutes: 45,
  servings: 8,
  description: '充滿伯爵茶香氣的英式磅蛋糕，奶油濃郁、口感紮實，是下午茶的絕佳選擇。',
  ingredients: [
    { id: 'ai1', name: '低筋麵粉', amount: 200, unit: 'g', isBase: true },
    { id: 'ai2', name: '無鹽奶油', amount: 200, unit: 'g', isBase: false },
    { id: 'ai3', name: '細砂糖',   amount: 160, unit: 'g', isBase: false },
    { id: 'ai4', name: '雞蛋',     amount: 4,   unit: '顆', isBase: false },
    { id: 'ai5', name: '伯爵茶包', amount: 3,   unit: '包', isBase: false },
    { id: 'ai6', name: '泡打粉',   amount: 4,   unit: 'g', isBase: false },
  ],
  steps: [
    { id: 'as1', order: 1, description: '奶油室溫軟化，加糖打發至泛白蓬鬆。', timerMinutes: null },
    { id: 'as2', order: 2, description: '分次加入雞蛋，每次充分攪拌均勻。', timerMinutes: null },
    { id: 'as3', order: 3, description: '篩入麵粉、泡打粉、伯爵茶葉，翻拌至無粉粒。', timerMinutes: null },
    { id: 'as4', order: 4, description: '倒入磅蛋糕模，170°C 烤 45 分鐘。', timerMinutes: 45 },
  ],
};

export default function UploadRecipe({ onBack }) {
  const { dispatch } = useApp();
  const [mode, setMode] = useState('manual'); // manual | scan
  const [scanMode, setScanMode] = useState('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState(SCAN_STEPS[0][1]);
  const [aiDone, setAiDone] = useState(false);

  // Manual form state
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [emoji, setEmoji] = useState('🍞');
  const [category, setCategory] = useState('麵包');
  const [difficulty, setDifficulty] = useState('入門');
  const [totalMinutes, setTotalMinutes] = useState('');
  const [ovenTemp, setOvenTemp] = useState('');
  const [bakeMinutes, setBakeMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [description, setDescription] = useState('');

  const startScan = () => {
    setScanMode('scanning');
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
          setAiDone(true);
        }, 300);
      }
    }, 550);
  };

  const saveManual = () => {
    const recipe = {
      id: uuid(),
      name: name || '無名食譜',
      subtitle, emoji, category, difficulty,
      totalMinutes: Number(totalMinutes) || 60,
      ovenTemp: ovenTemp || '—',
      bakeMinutes: Number(bakeMinutes) || 0,
      servings: Number(servings) || 1,
      description,
      isUserUploaded: true,
      createdAt: new Date().toISOString(),
      ingredients: [],
      steps: [],
    };
    dispatch({ type: 'ADD_RECIPE', payload: recipe });
    onBack();
  };

  const saveAI = () => {
    const recipe = { ...AI_RESULT, id: uuid(), isUserUploaded: true, createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_RECIPE', payload: recipe });
    onBack();
  };

  return (
    <div className="page" style={{ background: '#F2F0EB' }}>
      {/* Header */}
      <div className="hero-header" style={{ background: '#7B5EA7', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>上傳食譜</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>AI 辨識或手動輸入</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 18px 0' }}>
        {[['scan', '📷 AI 圖片辨識'], ['manual', '✏️ 手動輸入']].map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} style={{
            flex: 1, padding: '10px 0', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: mode === key ? '#7B5EA7' : 'white',
            color: mode === key ? 'white' : '#888',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* AI Scan */}
        {mode === 'scan' && (
          <>
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5EA7', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>拍照辨識食譜</div>
              {scanMode === 'idle' && !aiDone && (
                <>
                  <div className="scan-zone" onClick={startScan} style={{ borderColor: '#7B5EA7' }}>
                    <div style={{ fontSize: 32 }}>📷</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4A3BA0' }}>拍攝食譜截圖或書本</div>
                    <div style={{ fontSize: 12, color: '#888' }}>AI 自動辨識食材、步驟與配比</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {['📷 拍照', '🖼️ 選圖', '📋 截圖'].map(lbl => (
                      <button key={lbl} onClick={startScan} style={{ flex: 1, padding: '9px 0', background: '#F0EEFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#4A3BA0', cursor: 'pointer', fontFamily: 'inherit' }}>{lbl}</button>
                    ))}
                  </div>
                </>
              )}
              {scanMode === 'scanning' && (
                <div style={{ padding: '16px 0' }}>
                  <ScanProgressView status={scanStatus} progress={scanProgress} />
                </div>
              )}
              {aiDone && (
                <div style={{ background: '#F0EEFF', borderRadius: 14, padding: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7B5EA7' }} />
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#4A3BA0' }}>辨識完成</span>
                  </div>
                  {[['食譜名稱', AI_RESULT.name], ['副標題', AI_RESULT.subtitle], ['分類', AI_RESULT.category], ['難度', AI_RESULT.difficulty], ['食材數', `${AI_RESULT.ingredients.length} 種`], ['步驟數', `${AI_RESULT.steps.length} 步`]].map(([f, v]) => (
                    <div key={f}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4A3BA0', width: 64 }}>{f}</span>
                        <span>{v}</span>
                      </div>
                      <div className="divider" />
                    </div>
                  ))}
                  <button onClick={() => { setScanMode('idle'); setAiDone(false); }} style={{ fontSize: 12, fontWeight: 700, color: '#7B5EA7', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>重新辨識</button>
                </div>
              )}
            </div>
            {aiDone && <PrimaryButton label="儲存辨識的食譜 ✓" color="#7B5EA7" onClick={saveAI} />}
          </>
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <FormField label="Emoji" color="#7B5EA7">
                  <input className="bake-input" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: 60, textAlign: 'center', fontSize: 24 }} />
                </FormField>
                <div style={{ flex: 1 }}>
                  <FormField label="食譜名稱" color="#7B5EA7">
                    <input className="bake-input" placeholder="例：伯爵茶磅蛋糕" value={name} onChange={e => setName(e.target.value)} />
                  </FormField>
                </div>
              </div>
              <FormField label="副標題" color="#7B5EA7">
                <input className="bake-input" placeholder="例：伯爵茶香・濃郁奶油" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
              </FormField>
              <FormField label="食譜描述" color="#7B5EA7">
                <textarea className="bake-input" placeholder="描述這道食譜的特色..." value={description} onChange={e => setDescription(e.target.value)} />
              </FormField>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FormField label="分類" color="#7B5EA7">
                    <select className="bake-input" value={category} onChange={e => setCategory(e.target.value)}>
                      {RECIPE_CATEGORIES.filter(c => c !== '全部').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                <div style={{ flex: 1 }}>
                  <FormField label="難度" color="#7B5EA7">
                    <select className="bake-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                      {Object.keys(DIFFICULTIES).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </FormField>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <FormField label="總時間（分）" color="#7B5EA7">
                  <input className="bake-input" type="number" placeholder="60" value={totalMinutes} onChange={e => setTotalMinutes(e.target.value)} />
                </FormField>
                <FormField label="烤溫" color="#7B5EA7">
                  <input className="bake-input" placeholder="170°C" value={ovenTemp} onChange={e => setOvenTemp(e.target.value)} />
                </FormField>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <FormField label="烘烤時間（分）" color="#7B5EA7">
                  <input className="bake-input" type="number" placeholder="45" value={bakeMinutes} onChange={e => setBakeMinutes(e.target.value)} />
                </FormField>
                <FormField label="份量（份）" color="#7B5EA7">
                  <input className="bake-input" type="number" placeholder="8" value={servings} onChange={e => setServings(e.target.value)} />
                </FormField>
              </div>
            </div>

            <div style={{ background: '#EAFBF0', borderRadius: 14, padding: 12, fontSize: 12, color: '#2E7D52' }}>
              💡 儲存後可在食譜詳情中繼續新增食材與步驟
            </div>

            <PrimaryButton label="儲存食譜 ✓" color="#7B5EA7" onClick={saveManual} />
          </>
        )}
      </div>
    </div>
  );
}
