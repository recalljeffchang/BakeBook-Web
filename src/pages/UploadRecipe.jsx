// src/pages/UploadRecipe.jsx
import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from '../utils/uuid';
import { RECIPE_CATEGORIES, DIFFICULTIES } from '../data/models';
import { FormField, PrimaryButton, BackButton } from '../components/UI';
import { GEMINI_MODELS } from './Settings';

// ─── Gemini API ────────────────────────────────────────────────────────────────
// Build model list: preferred model first, then the rest as fallback
function getModelOrder() {
  const preferred = localStorage.getItem('bb_gemini_model');
  const all = GEMINI_MODELS.map(m => m.id);
  if (!preferred) return all;
  return [preferred, ...all.filter(id => id !== preferred)];
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROMPT = `你是一位專業的烘焙食譜辨識助手。請仔細分析這張圖片（可能是食譜書、手寫食譜、截圖、或食物照片），並精確提取以下資訊。

請以純 JSON 格式回覆，不要有任何 markdown 或額外說明，格式如下：
{
  "name": "食譜名稱（繁體中文）",
  "subtitle": "副標題或描述（20字以內）",
  "category": "麵包 或 蛋糕 或 餅乾 或 點心 之一",
  "difficulty": "入門 或 中等 或 進階 之一",
  "emoji": "最適合的食物 emoji（1個）",
  "totalMinutes": 總製作時間分鐘數（數字）,
  "ovenTemp": "烤溫如 170°C，若不需要填蒸製",
  "bakeMinutes": 烘烤時間分鐘數（數字）,
  "servings": 份量數（數字）,
  "description": "食譜描述（50字以內）",
  "ingredients": [
    { "name": "材料名稱", "amount": 數量（數字）, "unit": "g 或 ml 或 顆 等", "isBase": true或false（主要粉類標true）}
  ],
  "steps": [
    { "order": 步驟編號, "description": "步驟說明", "timerMinutes": null或計時分鐘數 }
  ]
}

若圖片不是食譜，ingredients 和 steps 可為空陣列，但請盡力填寫 name 和 description。`;

// Parse "Please retry in Xs" from Gemini quota error messages
function parseRetrySeconds(msg) {
  const match = msg.match(/retry in ([\d.]+)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

async function callGemini(apiKey, model, base64Image, mimeType) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Image } }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${response.status}`;
    const retrySecs = parseRetrySeconds(msg);
    const friendly = retrySecs
      ? `配額暫時耗盡，請等待 ${retrySecs} 秒後重試`
      : msg;
    const error = new Error(friendly);
    error.isQuota = response.status === 429 || msg.includes('quota') || msg.includes('limit');
    error.retrySecs = retrySecs;
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// Try each model in fallback order; skip to next on quota errors
async function analyzeImageWithGemini(apiKey, base64Image, mimeType, onModelChange) {
  let lastError;
  for (const model of getModelOrder()) {  // getModelOrder() reads localStorage at call time
    if (onModelChange) onModelChange(model);
    try {
      return await callGemini(apiKey, model, base64Image, mimeType);
    } catch (err) {
      lastError = err;
      if (!err.isQuota) break; // non-quota errors → don't try next model
      // quota error → try next model in chain
    }
  }
  throw lastError;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the data URL prefix: "data:image/jpeg;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Scan progress steps (shown during real API call) ─────────────────────────
const SCAN_STEPS = [
  '上傳圖片中...',
  '分析圖片構圖...',
  '辨識食材清單...',
  '讀取烘焙步驟...',
  '整合食譜資料...',
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function UploadRecipe({ onBack }) {
  const { dispatch } = useApp();
  const [mode, setMode] = useState('scan');

  // API key state (persisted in localStorage)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('bb_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(() => !localStorage.getItem('bb_gemini_key'));

  // Scan state
  const [scanState, setScanState] = useState('idle'); // idle | scanning | done | error
  const [scanStep, setScanStep] = useState(0);
  const [currentModel, setCurrentModel] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

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

  const saveApiKey = (key) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('bb_gemini_key', trimmed);
      setShowKeyInput(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('請選擇圖片檔案（JPG, PNG, WEBP 等）');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAiResult(null);
    setErrorMsg('');

    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    await runScan(file);
  };

  const runScan = async (file) => {
    setScanState('scanning');
    setScanStep(0);
    setCurrentModel('');

    // Animate steps while the API call runs
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, SCAN_STEPS.length - 1);
      setScanStep(stepIdx);
    }, 900);

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeImageWithGemini(
        apiKey, base64, file.type,
        (model) => setCurrentModel(model)   // show which model is being tried
      );
      clearInterval(stepInterval);
      setScanStep(SCAN_STEPS.length - 1);
      setAiResult(result);
      setScanState('done');
    } catch (err) {
      clearInterval(stepInterval);
      const msg = err.retrySecs
        ? `配额暫時耗盡，請等待 ${err.retrySecs} 秒後再點「開始辨識」`
        : (err.message || '辨識失敗，請確認 API 金鑰或圖片格式');
      setErrorMsg(msg);
      setScanState('error');
    }
  };

  const retryWithFile = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const saveAI = () => {
    if (!aiResult) return;
    const recipe = {
      id: uuid(),
      name: aiResult.name || '無名食譜',
      subtitle: aiResult.subtitle || '',
      emoji: aiResult.emoji || '🍞',
      category: aiResult.category || '點心',
      difficulty: aiResult.difficulty || '入門',
      totalMinutes: Number(aiResult.totalMinutes) || 60,
      ovenTemp: aiResult.ovenTemp || '—',
      bakeMinutes: Number(aiResult.bakeMinutes) || 0,
      servings: Number(aiResult.servings) || 1,
      description: aiResult.description || '',
      isUserUploaded: true,
      createdAt: new Date().toISOString(),
      ingredients: (aiResult.ingredients || []).map((ing, i) => ({ ...ing, id: `ai_ing_${i}` })),
      steps: (aiResult.steps || []).map((s, i) => ({ ...s, id: `ai_step_${i}` })),
    };
    dispatch({ type: 'ADD_RECIPE', payload: recipe });
    onBack();
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
            flex: 1, padding: '10px 0', border: 'none', borderRadius: 12,
            fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: mode === key ? '#7B5EA7' : 'white',
            color: mode === key ? 'white' : '#888',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ─── AI Scan Mode ─── */}
        {mode === 'scan' && (
          <>
            {/* API Key Setup */}
            {showKeyInput && (
              <div className="card" style={{ borderLeft: '3px solid #7B5EA7' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4A3BA0', marginBottom: 4 }}>
                  🔑 輸入 Gemini API 金鑰
                </div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>
                  免費申請：前往{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                    style={{ color: '#7B5EA7', fontWeight: 700 }}>
                    aistudio.google.com/apikey
                  </a>
                  {' '}取得金鑰，金鑰僅儲存於本機。
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="bake-input"
                    type="password"
                    placeholder="AIza..."
                    defaultValue={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={() => saveApiKey(apiKey)}
                    style={{
                      padding: '9px 16px', background: '#7B5EA7', color: 'white',
                      border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >儲存</button>
                </div>
                {apiKey && (
                  <button onClick={() => setShowKeyInput(false)}
                    style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>
                    使用已儲存的金鑰 →
                  </button>
                )}
              </div>
            )}

            {/* Scan Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5EA7', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                  拍照辨識食譜
                </div>
                {apiKey && !showKeyInput && (
                  <button onClick={() => setShowKeyInput(true)}
                    style={{ fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🔑 更換金鑰
                  </button>
                )}
              </div>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0])}
              />

              {/* Idle state */}
              {(scanState === 'idle' || scanState === 'error') && (
                <>
                  {/* Image preview or upload zone */}
                  {previewUrl ? (
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <img src={previewUrl} alt="預覽"
                        style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover' }} />
                      <button
                        onClick={() => { setPreviewUrl(null); setErrorMsg(''); setScanState('idle'); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: 20, width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="scan-zone" onClick={() => fileInputRef.current?.click()}
                      style={{ borderColor: '#7B5EA7', marginBottom: 10 }}>
                      <div style={{ fontSize: 36 }}>📷</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#4A3BA0' }}>拍攝食譜截圖或書本</div>
                      <div style={{ fontSize: 12, color: '#888' }}>Gemini AI 自動辨識食材、步驟與配比</div>
                    </div>
                  )}

                  {/* Error */}
                  {scanState === 'error' && (
                    <div style={{ background: '#FCEBEB', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 12, color: '#791F1F' }}>
                      ⚠ {errorMsg}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); } }}
                      style={{ flex: 1, padding: '9px 0', background: '#F0EEFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#4A3BA0', cursor: 'pointer', fontFamily: 'inherit' }}>
                      🖼️ 選取圖片
                    </button>
                    <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); } }}
                      style={{ flex: 1, padding: '9px 0', background: '#F0EEFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#4A3BA0', cursor: 'pointer', fontFamily: 'inherit' }}>
                      📷 相機拍照
                    </button>
                    {previewUrl && (
                      <button onClick={() => { const file = fileInputRef.current?.files?.[0]; if (file) runScan(file); else fileInputRef.current?.click(); }}
                        style={{ flex: 1, padding: '9px 0', background: '#7B5EA7', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🔍 開始辨識
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Scanning state */}
              {scanState === 'scanning' && (
                <div style={{ padding: '12px 0' }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="辨識中"
                      style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', marginBottom: 14, opacity: 0.7 }} />
                  )}
                  <div style={{ textAlign: 'center', fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4A3BA0', textAlign: 'center', marginBottom: 10 }}>
                    {SCAN_STEPS[scanStep]}
                  </div>
                  {/* Animated progress bar */}
                  <div style={{ background: '#E8E0F7', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: '#7B5EA7', borderRadius: 4,
                      width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 }}>
                    {currentModel ? `使用 ${currentModel} 辨識中...` : 'Gemini AI 分析中，請稍候...'}
                  </div>
                </div>
              )}

              {/* Done — Result card */}
              {scanState === 'done' && aiResult && (
                <div>
                  {previewUrl && (
                    <img src={previewUrl} alt="辨識完成"
                      style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', marginBottom: 12 }} />
                  )}
                  <div style={{ background: '#F0EEFF', borderRadius: 14, padding: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7B5EA7' }} />
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#4A3BA0' }}>辨識完成 ✓</span>
                      <span style={{ fontSize: 18, marginLeft: 2 }}>{aiResult.emoji}</span>
                    </div>

                    {[
                      ['食譜名稱', aiResult.name],
                      aiResult.subtitle && ['副標題', aiResult.subtitle],
                      ['分類', aiResult.category],
                      ['難度', aiResult.difficulty],
                      aiResult.totalMinutes && ['總時間', `${aiResult.totalMinutes} 分鐘`],
                      aiResult.ovenTemp && ['烤溫', aiResult.ovenTemp],
                      aiResult.ingredients?.length && ['食材數', `${aiResult.ingredients.length} 種`],
                      aiResult.steps?.length && ['步驟數', `${aiResult.steps.length} 步`],
                    ].filter(Boolean).map(([f, v]) => (
                      <div key={f}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#4A3BA0', minWidth: 64 }}>{f}</span>
                          <span style={{ color: '#333', textAlign: 'right', flex: 1 }}>{v}</span>
                        </div>
                        <div className="divider" />
                      </div>
                    ))}

                    {/* Preview ingredients */}
                    {aiResult.ingredients?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5EA7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>材料預覽</div>
                        {aiResult.ingredients.slice(0, 4).map((ing, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#444' }}>
                            <span>{ing.name}</span>
                            <span style={{ fontWeight: 700 }}>{ing.amount}{ing.unit}</span>
                          </div>
                        ))}
                        {aiResult.ingredients.length > 4 && (
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                            + {aiResult.ingredients.length - 4} 種材料...
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={() => { setScanState('idle'); setAiResult(null); }}
                      style={{ fontSize: 12, fontWeight: 700, color: '#7B5EA7', background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, fontFamily: 'inherit' }}>
                      重新辨識
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save button — only when done */}
            {scanState === 'done' && aiResult && (
              <PrimaryButton label={`儲存「${aiResult.name}」食譜 ✓`} color="#7B5EA7" onClick={saveAI} />
            )}
          </>
        )}

        {/* ─── Manual Mode ─── */}
        {mode === 'manual' && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <FormField label="Emoji" color="#7B5EA7">
                  <input className="bake-input" value={emoji} onChange={e => setEmoji(e.target.value)}
                    style={{ width: 60, textAlign: 'center', fontSize: 24 }} />
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
