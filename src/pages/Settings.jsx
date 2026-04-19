// src/pages/Settings.jsx
import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Trash2, RefreshCw, Key, Database, Info, ChevronRight, Cpu, Zap } from 'lucide-react';
import { BackButton } from '../components/UI';
import { SAMPLE_RECIPES, SAMPLE_JOURNAL, SAMPLE_INVENTORY } from '../data/sampleData';

// ─── All supported Gemini models ─────────────────────────────────────────────
export const GEMINI_MODELS = [
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash Lite',
    badge: '推薦',
    badgeColor: '#2E7D52',
    desc: '免費額度最寬裕，速度最快，適合日常使用',
    rpm: '30 RPM',
    rpd: '1,500 RPD',
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    badge: '標準',
    badgeColor: '#7B5EA7',
    desc: '功能完整，辨識準確度高',
    rpm: '15 RPM',
    rpd: '1,500 RPD',
  },
  {
    id: 'gemini-2.0-flash-exp',
    label: 'Gemini 2.0 Flash Exp',
    badge: '實驗',
    badgeColor: '#C8A97E',
    desc: '最新實驗性模型，搶先體驗新功能',
    rpm: '15 RPM',
    rpd: '1,500 RPD',
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    badge: '舊世代',
    badgeColor: '#888',
    desc: '第一代 Flash，部分金鑰可能不支援',
    rpm: '15 RPM',
    rpd: '1,500 RPD',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    badge: 'Pro',
    badgeColor: '#E8A62D',
    desc: '最高精度，需付費方案或高配額帳號',
    rpm: '2 RPM',
    rpd: '50 RPD',
  },
];

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function pingModel(apiKey, modelId) {
  const res = await fetch(`${GEMINI_BASE}/${modelId}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'OK' }] }],
      generationConfig: { maxOutputTokens: 4 },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `HTTP ${res.status}`;
    // Quota errors still mean the model EXISTS and your key CAN use it
    const isQuota = res.status === 429 || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit');
    if (isQuota) return 'quota'; // available but rate-limited right now
    return 'fail';
  }
  return 'ok';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 10px' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{title}</span>
    </div>
  );
}

function RowItem({ label, value, right, onPress, dangerous }) {
  return (
    <div onClick={onPress} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', cursor: onPress ? 'pointer' : 'default' }}>
      <span style={{ fontSize: 14, color: dangerous ? '#E24B4A' : '#1a1a1a', fontWeight: dangerous ? 700 : 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span style={{ fontSize: 13, color: '#888' }}>{value}</span>}
        {right}
        {onPress && <ChevronRight size={14} color="#ccc" />}
      </div>
    </div>
  );
}

// Status icon for model scan result
function ModelStatus({ status }) {
  if (status === 'scanning') return <RefreshCw size={14} color="#EF9F27" style={{ animation: 'spin 0.8s linear infinite' }} />;
  if (status === 'ok')       return <CheckCircle size={14} color="#2E7D52" />;
  if (status === 'quota')    return <Zap size={14} color="#EF9F27" />;
  if (status === 'fail')     return <XCircle size={14} color="#E24B4A" />;
  return null;
}

function StatusLabel({ status }) {
  const map = {
    ok:       { text: '可用 ✓',   color: '#2E7D52' },
    quota:    { text: '可用（配額暫限）', color: '#EF9F27' },
    fail:     { text: '不支援 ✗', color: '#E24B4A' },
    scanning: { text: '測試中...', color: '#EF9F27' },
  };
  const s = map[status];
  if (!s) return null;
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.text}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Settings({ onBack }) {
  // ── API Key ───────────────────────────────────────────────────────
  const [apiKey, setApiKey]     = useState(() => localStorage.getItem('bb_gemini_key') || '');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [editMode, setEditMode] = useState(!localStorage.getItem('bb_gemini_key'));

  const maskedKey = apiKey ? apiKey.slice(0, 6) + '••••••••••••••••••' + apiKey.slice(-4) : '';

  const saveKey = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    localStorage.setItem('bb_gemini_key', trimmed);
    setApiKey(trimmed);
    setInputKey('');
    setEditMode(false);
    setModelStatuses({});
  };

  const deleteKey = () => {
    localStorage.removeItem('bb_gemini_key');
    setApiKey('');
    setInputKey('');
    setEditMode(true);
    setModelStatuses({});
  };

  // ── Model selection ───────────────────────────────────────────────
  const [preferredModel, setPreferredModel] = useState(
    () => localStorage.getItem('bb_gemini_model') || GEMINI_MODELS[0].id
  );
  const [modelStatuses, setModelStatuses]   = useState({}); // { modelId: 'ok'|'quota'|'fail'|'scanning' }
  const [isScanningAll, setIsScanningAll]   = useState(false);

  const selectModel = (id) => {
    setPreferredModel(id);
    localStorage.setItem('bb_gemini_model', id);
  };

  const scanAllModels = async () => {
    if (!apiKey || isScanningAll) return;
    setIsScanningAll(true);
    const newStatuses = {};

    for (const model of GEMINI_MODELS) {
      setModelStatuses(prev => ({ ...prev, [model.id]: 'scanning' }));
      const result = await pingModel(apiKey, model.id);
      newStatuses[model.id] = result;
      setModelStatuses(prev => ({ ...prev, [model.id]: result }));
    }

    // Auto-select the best available model
    const best = GEMINI_MODELS.find(m => newStatuses[m.id] === 'ok' || newStatuses[m.id] === 'quota');
    if (best && newStatuses[best.id] !== undefined) {
      selectModel(best.id);
    }
    setIsScanningAll(false);
  };

  // ── Data management ───────────────────────────────────────────────
  const [resetConfirm, setResetConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const resetToSampleData = () => {
    localStorage.setItem('bb_recipes',   JSON.stringify(SAMPLE_RECIPES));
    localStorage.setItem('bb_journal',   JSON.stringify(SAMPLE_JOURNAL));
    localStorage.setItem('bb_inventory', JSON.stringify(SAMPLE_INVENTORY));
    window.location.reload();
  };

  const clearAllData = () => {
    localStorage.removeItem('bb_recipes');
    localStorage.removeItem('bb_journal');
    localStorage.removeItem('bb_inventory');
    window.location.reload();
  };

  const preferredMeta = GEMINI_MODELS.find(m => m.id === preferredModel) || GEMINI_MODELS[0];

  return (
    <div className="page" style={{ background: '#F2F0EB' }}>
      {/* Header */}
      <div className="hero-header" style={{ background: '#3A3A3C', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>設定</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>管理 API 金鑰、模型與應用程式資料</div>
        </div>
      </div>

      <div style={{ padding: '16px 18px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ─── API Key ─── */}
        <div className="card">
          <SectionHeader icon={Key} title="Gemini API 金鑰" color="#7B5EA7" />

          {apiKey && !editMode ? (
            <div style={{ background: '#F0EEFF', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5EA7', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>已儲存的 API 金鑰</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#333', letterSpacing: 1 }}>
                    {showKey ? apiKey : maskedKey}
                  </div>
                </div>
                <button onClick={() => setShowKey(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B5EA7', padding: 4 }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 10 }}>
                前往{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#7B5EA7', fontWeight: 700 }}>
                  aistudio.google.com/apikey
                </a>
                {' '}免費申請。金鑰僅存於本機，不會上傳任何伺服器。
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input className="bake-input" type={showKey ? 'text' : 'password'} placeholder="AIza..." value={inputKey}
                    onChange={e => setInputKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveKey()} style={{ paddingRight: 38 }} />
                  <button onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button onClick={saveKey} disabled={!inputKey.trim()} style={{ padding: '9px 16px', background: inputKey.trim() ? '#7B5EA7' : '#ccc', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: inputKey.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', flexShrink: 0 }}>儲存</button>
              </div>
              {apiKey && <button onClick={() => setEditMode(false)} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>← 返回使用現有金鑰</button>}
            </div>
          )}

          {apiKey && !editMode && (
            <>
              <div className="divider" />
              <RowItem label="更換 API 金鑰" onPress={() => { setEditMode(true); setShowKey(false); }} />
              <div className="divider" />
              <RowItem label="刪除 API 金鑰" dangerous right={<Trash2 size={14} color="#E24B4A" />} onPress={deleteKey} />
            </>
          )}

          <div style={{ marginTop: 12, padding: 10, background: '#F9F7FF', borderRadius: 10, fontSize: 11, color: '#6B5A9B', lineHeight: 1.6 }}>
            🔒 金鑰僅存於裝置。免費版每天最多 1,500 次辨識。
          </div>
        </div>

        {/* ─── Model Management ─── */}
        <div className="card">
          <SectionHeader icon={Cpu} title="AI 模型管理" color="#2E7D52" />

          {/* Current model badge */}
          <div style={{ background: '#F0F8F4', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>目前使用模型</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>{preferredMeta.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: preferredMeta.badgeColor + '22', color: preferredMeta.badgeColor }}>{preferredMeta.badge}</span>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{preferredMeta.desc}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              {preferredMeta.rpm} · {preferredMeta.rpd}
            </div>
          </div>

          {/* Scan button */}
          {apiKey && (
            <button
              onClick={scanAllModels}
              disabled={isScanningAll}
              style={{
                width: '100%', padding: '10px 0', marginBottom: 12,
                background: isScanningAll ? '#e8e4dd' : '#1C5E3A',
                color: isScanningAll ? '#888' : 'white',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13,
                cursor: isScanningAll ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {isScanningAll
                ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> 掃描中，請稍候...</>
                : '🔍 掃描可用模型（自動偵測）'}
            </button>
          )}

          {/* Model list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GEMINI_MODELS.map((model) => {
              const status = modelStatuses[model.id];
              const isSelected = preferredModel === model.id;
              const unavailable = status === 'fail';

              return (
                <div
                  key={model.id}
                  onClick={() => !unavailable && selectModel(model.id)}
                  style={{
                    padding: 12, borderRadius: 12, cursor: unavailable ? 'not-allowed' : 'pointer',
                    background: isSelected ? '#EAFBF0' : '#F9F7F4',
                    border: `2px solid ${isSelected ? '#2E7D52' : 'transparent'}`,
                    opacity: unavailable ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {/* Top row: radio + name + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${isSelected ? '#2E7D52' : '#ccc'}`,
                          background: isSelected ? '#2E7D52' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#1C5E3A' : '#333' }}>
                          {model.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: model.badgeColor + '22', color: model.badgeColor }}>
                          {model.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginLeft: 23, lineHeight: 1.4 }}>{model.desc}</div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, marginLeft: 23 }}>{model.rpm} · {model.rpd}</div>
                    </div>

                    {/* Status indicator */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 8, minWidth: 80 }}>
                      <ModelStatus status={status} />
                      <StatusLabel status={status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!apiKey && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#aaa', textAlign: 'center' }}>
              請先輸入 API 金鑰才能掃描可用模型
            </div>
          )}

          <div style={{ marginTop: 12, padding: 10, background: '#F0F8F4', borderRadius: 10, fontSize: 11, color: '#2E7D52', lineHeight: 1.6 }}>
            💡 <strong>⚡ 可用</strong> = 金鑰支援此模型 &nbsp;|&nbsp; <strong>🟡 配額暫限</strong> = 支援但目前達到速率上限，稍候可重試 &nbsp;|&nbsp; <strong>✗ 不支援</strong> = 此金鑰無法使用
          </div>
        </div>

        {/* ─── Data Management ─── */}
        <div className="card">
          <SectionHeader icon={Database} title="資料管理" color="#C8A97E" />

          <div style={{ background: '#FBF8F4', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7B55', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>目前儲存量</div>
            {[
              ['食譜', JSON.parse(localStorage.getItem('bb_recipes') || '[]').length, '筆'],
              ['日誌', JSON.parse(localStorage.getItem('bb_journal') || '[]').length, '筆'],
              ['食材庫存', JSON.parse(localStorage.getItem('bb_inventory') || '[]').length, '項'],
            ].map(([label, count, unit]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#9E7B55' }}>{count} {unit}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(158,123,85,0.15)', marginTop: 8, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
              <span>localStorage 佔用</span>
              <span>{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="divider" />
          {!resetConfirm ? (
            <RowItem label="重置為範例資料" value="還原成內建食譜與庫存" right={<RefreshCw size={14} color="#EF9F27" />} onPress={() => setResetConfirm(true)} />
          ) : (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: 13, color: '#9E7B55', marginBottom: 10, fontWeight: 600 }}>確定重置為範例資料？現有資料將被覆蓋。</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resetToSampleData} style={{ flex: 1, padding: '9px 0', background: '#EF9F27', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>確認重置</button>
                <button onClick={() => setResetConfirm(false)} style={{ flex: 1, padding: '9px 0', background: '#F0EBE3', color: '#666', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
              </div>
            </div>
          )}

          <div className="divider" />
          {!clearConfirm ? (
            <RowItem label="清除所有資料" dangerous right={<Trash2 size={14} color="#E24B4A" />} onPress={() => setClearConfirm(true)} />
          ) : (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: 13, color: '#791F1F', marginBottom: 10, fontWeight: 600 }}>⚠ 所有食譜、日誌和庫存資料將永久刪除，無法復原。</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAllData} style={{ flex: 1, padding: '9px 0', background: '#E24B4A', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>永久清除</button>
                <button onClick={() => setClearConfirm(false)} style={{ flex: 1, padding: '9px 0', background: '#F0EBE3', color: '#666', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
              </div>
            </div>
          )}
        </div>

        {/* ─── About ─── */}
        <div className="card">
          <SectionHeader icon={Info} title="關於 BakeBook" color="#C8A97E" />
          {[
            ['版本', '1.0.0'],
            ['技術棧', 'React 19 + Vite 8'],
            ['AI 引擎', `Google Gemini (${preferredMeta.label})`],
            ['資料儲存', 'localStorage（本地）'],
            ['部署', 'GitHub Pages'],
          ].map(([label, val], i, arr) => (
            <div key={label}>
              <div className="info-row" style={{ padding: '8px 0' }}>
                <span className="info-label">{label}</span>
                <span className="info-value" style={{ fontWeight: 600, fontSize: 13 }}>{val}</span>
              </div>
              {i < arr.length - 1 && <div className="divider" />}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <a href="https://github.com/recalljeffchang/BakeBook-Web" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📂 GitHub 原始碼</span>
              <ChevronRight size={12} />
            </a>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
