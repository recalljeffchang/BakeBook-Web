// src/pages/UltraBridge.jsx
// ─── Single-page wizard combining Phase 1 (send to Gemini Ultra) + Phase 2 (import JSON) ───
import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuid } from '../utils/uuid';
import { BackButton } from '../components/UI';

// ─── Ultra prompt — engineered for clean JSON output ─────────────────────────
const ULTRA_PROMPT = `你是一位專業的烘焙食譜辨識助手。請仔細分析我附上的這張圖片（食譜書、手寫食譜、截圖或食物照片），並準確提取所有資訊。

請「只」以純 JSON 格式回覆，不要有任何 markdown 符號（不要 \`\`\`json）、不要任何解釋文字，直接輸出 JSON 物件：
{
  "name": "食譜名稱（繁體中文）",
  "subtitle": "副標題或簡短描述（20字以內）",
  "category": "麵包 或 蛋糕 或 餅乾 或 點心",
  "difficulty": "入門 或 中等 或 進階",
  "emoji": "最適合的食物 emoji（1個）",
  "totalMinutes": 總製作時間分鐘（數字）,
  "ovenTemp": "烤溫例如 170°C，不需要烤箱則填 無烤箱",
  "bakeMinutes": 烘烤時間分鐘（數字，沒有則填 0）,
  "servings": 份量數（數字）,
  "description": "食譜特色描述（50字以內）",
  "ingredients": [
    { "name": "材料名稱", "amount": 數量, "unit": "g 或 ml 或 顆", "isBase": true 或 false }
  ],
  "steps": [
    { "order": 步驟編號, "description": "步驟說明", "timerMinutes": null 或 計時分鐘數 }
  ]
}`;

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, icon: '📸', title: '選擇食譜圖片',    subtitle: '從相簿或相機選取' },
  { id: 2, icon: '📋', title: '複製提示詞',       subtitle: '一鍵複製，前往 Gemini Ultra' },
  { id: 3, icon: '✨', title: '讓 Ultra 分析圖片', subtitle: '在 Gemini 貼上提示詞並上傳圖片' },
  { id: 4, icon: '📥', title: '貼入 JSON 結果',   subtitle: '將 Gemini 回傳的 JSON 貼入' },
  { id: 5, icon: '💾', title: '儲存食譜',          subtitle: '確認內容後儲存到 BakeBook' },
];

function StepBadge({ n, done, active }) {
  const bg = done ? '#2E7D52' : active ? '#B8860B' : '#e8e4dd';
  const color = done || active ? 'white' : '#aaa';
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: bg, color, fontSize: 12, fontWeight: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {done ? '✓' : n}
    </div>
  );
}

export default function UltraBridge({ onBack }) {
  const { dispatch } = useApp();
  const fileInputRef = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [imageFile, setImageFile]   = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [shareStatus, setShareStatus] = useState('idle'); // idle | sharing | done | copied
  const [jsonRaw, setJsonRaw]       = useState('');
  const [parsed, setParsed]         = useState(null);
  const [jsonError, setJsonError]   = useState('');
  const [saved, setSaved]           = useState(false);

  // Derive current active step (3 steps now: select → send → paste → save)
  const activeStep = saved ? 5 : parsed ? 4 : jsonRaw.trim() ? 3 : shareStatus === 'done' || shareStatus === 'copied' ? 3 : imageFile ? 2 : 1;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShareStatus('idle');
    setJsonRaw('');
    setParsed(null);
    setJsonError('');
    setSaved(false);
  };

  // ── Smart send: image + prompt together ─────────────────────────────────────
  const shareToGemini = async () => {
    if (!imageFile) return;
    setShareStatus('sharing');

    // ① Try Web Share API (iOS/iPadOS/Android — sends image + text to Gemini app)
    const canWebShare = typeof navigator.share === 'function';
    if (canWebShare) {
      try {
        await navigator.share({
          title: 'BakeBook 食譜辨識',
          text: ULTRA_PROMPT,
          files: [imageFile],
        });
        setShareStatus('done');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // share failed (not user cancel) — fall through to clipboard method
        } else {
          setShareStatus('idle'); // user cancelled
          return;
        }
      }
    }

    // ② Fallback: copy image to clipboard (desktop Chrome/Edge)
    try {
      const clipItems = [new ClipboardItem({ [imageFile.type]: imageFile })];
      await navigator.clipboard.write(clipItems);
      // Also copy prompt text separately (user pastes image first, then prompt)
      // we tell them via UI
      setShareStatus('copied'); // image in clipboard, prompt shown
    } catch {
      // ③ Last resort: just copy text prompt
      try {
        await navigator.clipboard.writeText(ULTRA_PROMPT);
        setShareStatus('copied');
      } catch {
        setShareStatus('idle');
      }
    }

    // Open Gemini in new tab automatically
    window.open('https://gemini.google.com', '_blank');
  };

  const parseJson = (raw) => {
    setJsonRaw(raw);
    setJsonError('');
    setParsed(null);
    if (!raw.trim()) return;
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const obj = JSON.parse(cleaned);
      if (!obj.name) throw new Error('缺少 name 欄位，請確認貼入的是完整 JSON');
      setParsed(obj);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const saveRecipe = () => {
    if (!parsed) return;
    const recipe = {
      id: uuid(),
      name:         parsed.name || '無名食譜',
      subtitle:     parsed.subtitle || '',
      emoji:        parsed.emoji || '🍞',
      category:     parsed.category || '點心',
      difficulty:   parsed.difficulty || '入門',
      totalMinutes: Number(parsed.totalMinutes) || 60,
      ovenTemp:     parsed.ovenTemp || '—',
      bakeMinutes:  Number(parsed.bakeMinutes) || 0,
      servings:     Number(parsed.servings) || 1,
      description:  parsed.description || '',
      isUserUploaded: true,
      createdAt: new Date().toISOString(),
      ingredients: (parsed.ingredients || []).map((ing, i) => ({ ...ing, id: `ub_ing_${i}` })),
      steps:       (parsed.steps || []).map((s, i) => ({ ...s, id: `ub_step_${i}` })),
    };
    dispatch({ type: 'ADD_RECIPE', payload: recipe });
    setSaved(true);
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const stepDone   = (n) => activeStep > n;
  const stepActive = (n) => activeStep === n;

  const cardStyle = (n, extra = {}) => ({
    background: 'white',
    borderRadius: 16,
    padding: 16,
    border: `2px solid ${stepActive(n) ? '#B8860B' : stepDone(n) ? '#2E7D52' : '#f0ece6'}`,
    transition: 'border-color 0.2s',
    opacity: activeStep < n ? 0.45 : 1,
    ...extra,
  });

  const isShared = shareStatus === 'done' || shareStatus === 'copied';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ background: '#F2F0EB' }}>

      {/* Header */}
      <div className="hero-header" style={{
        background: 'linear-gradient(135deg, #2C1810 0%, #4A2C5E 100%)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <BackButton onClick={onBack} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>✨ Ultra 橋接</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
            Gemini Ultra 辨識 → 匯入 BakeBook
          </div>
        </div>
        {/* Step progress indicator */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingTop: 4 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{
              width: n === activeStep ? 18 : 6, height: 6, borderRadius: 3,
              background: n <= activeStep ? '#F5D78E' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Step 1: Select Image ── */}
        <div style={cardStyle(1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <StepBadge n={1} done={stepDone(1)} active={stepActive(1)} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>📸 選擇食譜圖片</div>
              <div style={{ fontSize: 11, color: '#888' }}>從相簿或相機選取要辨識的圖片</div>
            </div>
          </div>

          {previewUrl ? (
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <img src={previewUrl} alt="preview" style={{
                width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10,
              }} />
              <button onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                style={{
                  position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                  borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white',
                  border: 'none', fontSize: 14, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #d4c4b0', borderRadius: 12, padding: '28px 0',
                textAlign: 'center', cursor: 'pointer', color: '#aaa', marginBottom: 10,
                background: '#fdfcfa',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>🖼️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>點此選擇圖片</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>JPG · PNG · WEBP</div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
              background: '#F2EDE6', color: '#5a4a38', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>🖼 選取圖片</button>
            <button onClick={() => { fileInputRef.current.setAttribute('capture','environment'); fileInputRef.current?.click(); }} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
              background: '#F2EDE6', color: '#5a4a38', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>📷 相機拍照</button>
          </div>
        </div>

        {/* ── Step 2: Send Image + Prompt Together ── */}
        <div style={cardStyle(2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <StepBadge n={2} done={isShared} active={stepActive(2)} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>✨ 一鍵傳送給 Gemini Ultra</div>
              <div style={{ fontSize: 11, color: '#888' }}>圖片 + 提示詞同時送出</div>
            </div>
            {isShared && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#2E7D52' }}>✓ 已送出</span>}
          </div>

          {/* How it works */}
          <div style={{ background: '#F9F7FF', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 12, color: '#4A2C5E', lineHeight: 1.7 }}>
            {typeof navigator.share === 'function' ? (
              <>
                <strong>📱 偵測到行動裝置</strong><br />
                點擊按鈕後會開啟 iOS/Android 分享選單。
                選擇 <strong>Gemini App</strong>，圖片和提示詞會<strong>同時</strong>傳入！
              </>
            ) : (
              <>
                <strong>💻 桌面瀏覽器模式</strong><br />
                點擊後會將<strong>圖片複製到剪貼簿</strong>並自動開啟 Gemini 網頁。
                在 Gemini 對話框中：先貼上圖片 (Ctrl+V)，再貼上提示詞。
              </>
            )}
          </div>

          {/* The big button */}
          <button
            onClick={shareToGemini}
            disabled={!imageFile || shareStatus === 'sharing'}
            style={{
              width: '100%', padding: '14px 0', border: 'none', borderRadius: 13,
              background: isShared
                ? '#2E7D52'
                : !imageFile
                  ? '#ddd'
                  : shareStatus === 'sharing'
                    ? '#9575CD'
                    : 'linear-gradient(135deg, #2C1810, #4A2C5E)',
              color: !imageFile ? '#aaa' : 'white',
              fontWeight: 900, fontSize: 15,
              cursor: (!imageFile || shareStatus === 'sharing') ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {shareStatus === 'sharing' ? '⏳ 傳送中...' :
             shareStatus === 'done'    ? '✓ 已傳送到 Gemini！' :
             shareStatus === 'copied'  ? '✓ 已複製，請在 Gemini 貼上' :
             typeof navigator.share === 'function'
               ? '📤 分享圖片 + 提示詞到 Gemini'
               : '📋 複製圖片 + 開啟 Gemini'}
          </button>

          {/* Post-share guidance for desktop clipboard mode */}
          {shareStatus === 'copied' && (
            <div style={{ marginTop: 10, padding: 12, background: '#FFF8E7', borderRadius: 10, fontSize: 12, color: '#7A5C00', lineHeight: 1.7 }}>
              <strong>📋 圖片已在剪貼簿！下一步：</strong><br />
              1. 在 Gemini 對話框按 <kbd style={{ background: '#eee', padding: '1px 5px', borderRadius: 4 }}>Ctrl+V</kbd> 貼上圖片<br />
              2. 再貼上以下提示詞（長按複製）：
              <textarea
                readOnly
                value={ULTRA_PROMPT}
                rows={3}
                onFocus={e => e.target.select()}
                style={{
                  width: '100%', marginTop: 8, fontFamily: 'monospace', fontSize: 10,
                  borderRadius: 8, border: '1px solid #e0d0a0', padding: 8,
                  background: '#fffdf5', resize: 'none', color: '#555',
                }}
              />
            </div>
          )}

          {/* Already shared — remind user to come back */}
          {(shareStatus === 'done') && (
            <div style={{ marginTop: 10, padding: 12, background: '#E8F8EE', borderRadius: 10, fontSize: 12, color: '#1C5E3A', lineHeight: 1.7 }}>
              ✅ Gemini 正在分析您的圖片。分析完成後，複製全部 JSON 文字回到這裡貼入步驟 3。
            </div>
          )}
        </div>

        {/* ── Step 4: Paste JSON ── */}
        <div style={cardStyle(4)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <StepBadge n={4} done={stepDone(4)} active={!stepDone(4) && activeStep >= 3} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>📥 貼入 Ultra 回傳的 JSON</div>
              <div style={{ fontSize: 11, color: '#888' }}>複製 Gemini 的回覆，貼入下方</div>
            </div>
          </div>

          <textarea
            className="bake-input"
            rows={7}
            disabled={activeStep < 3}
            placeholder={'{\n  "name": "伯爵茶磅蛋糕",\n  "emoji": "🍰",\n  "ingredients": [...],\n  "steps": [...]\n}'}
            value={jsonRaw}
            onChange={e => parseJson(e.target.value)}
            style={{
              fontFamily: 'monospace', fontSize: 11, resize: 'vertical',
              background: activeStep < 3 ? '#fafafa' : 'white',
            }}
          />

          {jsonError && (
            <div style={{ marginTop: 8, padding: 10, background: '#FCEBEB', borderRadius: 10, fontSize: 12, color: '#791F1F', lineHeight: 1.5 }}>
              ⚠️ {jsonError}
            </div>
          )}

          {parsed && (
            <div style={{ marginTop: 10, background: 'linear-gradient(135deg, #F0EEFF, #E8F8EE)', borderRadius: 12, padding: 14 }}>
              {/* Recipe header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{parsed.emoji || '🍞'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#2C1810' }}>{parsed.name}</div>
                  {parsed.subtitle && <div style={{ fontSize: 11, color: '#7B5EA7', marginTop: 2 }}>{parsed.subtitle}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', background: '#2E7D52', color: 'white', borderRadius: 10 }}>
                  ✓ 驗證通過
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  ['🏷', '分類', parsed.category],
                  ['📊', '難度', parsed.difficulty],
                  parsed.ovenTemp && ['🌡', '烤溫', parsed.ovenTemp],
                  parsed.totalMinutes && ['⏱', '時間', `${parsed.totalMinutes} 分`],
                  parsed.ingredients?.length && ['🥚', '食材', `${parsed.ingredients.length} 種`],
                  parsed.steps?.length && ['📝', '步驟', `${parsed.steps.length} 步`],
                ].filter(Boolean).map(([icon, label, val]) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '6px 10px',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 9, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {parsed.description && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#555', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(255,255,255,0.5)', borderRadius: 8 }}>
                  {parsed.description}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Step 5: Save ── */}
        <div style={cardStyle(5)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <StepBadge n={5} done={saved} active={stepActive(5)} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>💾 儲存食譜</div>
              <div style={{ fontSize: 11, color: '#888' }}>確認內容無誤後儲存到 BakeBook</div>
            </div>
          </div>

          {saved ? (
            <div style={{
              padding: 20, background: 'linear-gradient(135deg, #1C5E3A, #2E7D52)',
              borderRadius: 14, textAlign: 'center', color: 'white',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>食譜儲存成功！</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
                「{parsed?.name}」已加入您的食譜庫
              </div>
              <button onClick={onBack} style={{
                padding: '10px 28px', background: 'rgba(255,255,255,0.2)', color: 'white',
                border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10,
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>← 返回食譜</button>
            </div>
          ) : (
            <button
              disabled={!parsed}
              onClick={saveRecipe}
              style={{
                width: '100%', padding: '14px 0', border: 'none', borderRadius: 13,
                background: parsed
                  ? 'linear-gradient(135deg, #2C1810, #4A2C5E)'
                  : '#ddd',
                color: parsed ? 'white' : '#aaa',
                fontWeight: 900, fontSize: 15, cursor: parsed ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              {parsed ? `✨ 儲存「${parsed.name}」` : '請先完成步驟 1–4'}
            </button>
          )}
        </div>

      </div>

      <style>{`
        .ub-step-active { border-color: #B8860B !important; }
      `}</style>
    </div>
  );
}
