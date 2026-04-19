// src/pages/Settings.jsx
import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Trash2, RefreshCw, Key, Database, Info, ChevronRight } from 'lucide-react';
import { BackButton } from '../components/UI';
import { SAMPLE_RECIPES, SAMPLE_JOURNAL, SAMPLE_INVENTORY } from '../data/sampleData';
import { useApp } from '../context/AppContext';

const GEMINI_TEST_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testApiKey(key) {
  const res = await fetch(`${GEMINI_TEST_ENDPOINT}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: '回覆 OK' }] }],
      generationConfig: { maxOutputTokens: 5 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return true;
}

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
    <div
      onClick={onPress}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '11px 0', cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 14, color: dangerous ? '#E24B4A' : '#1a1a1a', fontWeight: dangerous ? 700 : 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span style={{ fontSize: 13, color: '#888' }}>{value}</span>}
        {right}
        {onPress && <ChevronRight size={14} color="#ccc" />}
      </div>
    </div>
  );
}

export default function Settings({ onBack }) {
  const { dispatch } = useApp();

  // ── API Key state ─────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('bb_gemini_key') || '');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [editMode, setEditMode] = useState(!localStorage.getItem('bb_gemini_key'));
  const [testState, setTestState] = useState('idle'); // idle | testing | ok | fail
  const [testMsg, setTestMsg] = useState('');

  const maskedKey = apiKey
    ? apiKey.slice(0, 6) + '••••••••••••••••••' + apiKey.slice(-4)
    : '';

  const saveKey = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    localStorage.setItem('bb_gemini_key', trimmed);
    setApiKey(trimmed);
    setInputKey('');
    setEditMode(false);
    setTestState('idle');
  };

  const deleteKey = () => {
    localStorage.removeItem('bb_gemini_key');
    setApiKey('');
    setInputKey('');
    setEditMode(true);
    setTestState('idle');
  };

  const runTest = async () => {
    const key = apiKey;
    if (!key) return;
    setTestState('testing');
    setTestMsg('');
    try {
      await testApiKey(key);
      setTestState('ok');
      setTestMsg('API 金鑰有效，連線成功 ✓');
    } catch (err) {
      setTestState('fail');
      setTestMsg(err.message || '連線失敗');
    }
  };

  // ── Data management ───────────────────────────────────────────────
  const [resetConfirm, setResetConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const resetToSampleData = () => {
    localStorage.setItem('bb_recipes', JSON.stringify(SAMPLE_RECIPES));
    localStorage.setItem('bb_journal', JSON.stringify(SAMPLE_JOURNAL));
    localStorage.setItem('bb_inventory', JSON.stringify(SAMPLE_INVENTORY));
    window.location.reload();
  };

  const clearAllData = () => {
    localStorage.removeItem('bb_recipes');
    localStorage.removeItem('bb_journal');
    localStorage.removeItem('bb_inventory');
    window.location.reload();
  };

  const statusColors = { idle: '#888', testing: '#EF9F27', ok: '#2E7D52', fail: '#E24B4A' };
  const statusColor = statusColors[testState];

  return (
    <div className="page" style={{ background: '#F2F0EB' }}>
      {/* Header */}
      <div className="hero-header" style={{ background: '#3A3A3C', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>設定</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>管理 API 金鑰與應用程式資料</div>
        </div>
      </div>

      <div style={{ padding: '16px 18px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ─── Gemini API Key ─── */}
        <div className="card">
          <SectionHeader icon={Key} title="Gemini AI 金鑰管理" color="#7B5EA7" />

          {/* Key status banner */}
          {apiKey && !editMode ? (
            <div style={{ background: '#F0EEFF', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7B5EA7', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                    已儲存的 API 金鑰
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#333', letterSpacing: 1 }}>
                    {showKey ? apiKey : maskedKey}
                  </div>
                </div>
                <button onClick={() => setShowKey(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B5EA7', padding: 4 }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Test result badge */}
              {testState !== 'idle' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: statusColor, fontWeight: 600 }}>
                  {testState === 'testing' && <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                  {testState === 'ok'      && <CheckCircle size={12} />}
                  {testState === 'fail'    && <XCircle size={12} />}
                  {testMsg || (testState === 'testing' ? '測試連線中...' : '')}
                </div>
              )}
            </div>
          ) : (
            /* Key input form */
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 10 }}>
                前往{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                  style={{ color: '#7B5EA7', fontWeight: 700 }}>
                  aistudio.google.com/apikey
                </a>
                {' '}免費申請 Gemini API 金鑰。金鑰僅儲存於本機 localStorage，不會上傳至任何伺服器。
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="bake-input"
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={inputKey}
                    onChange={e => setInputKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveKey()}
                    style={{ paddingRight: 38 }}
                  />
                  <button onClick={() => setShowKey(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button onClick={saveKey} disabled={!inputKey.trim()}
                  style={{
                    padding: '9px 16px', background: inputKey.trim() ? '#7B5EA7' : '#ccc',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontWeight: 700, fontSize: 13, cursor: inputKey.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', flexShrink: 0,
                  }}>
                  儲存
                </button>
              </div>
              {apiKey && (
                <button onClick={() => setEditMode(false)} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'inherit' }}>
                  ← 返回，使用現有金鑰
                </button>
              )}
            </div>
          )}

          {/* Action row */}
          {apiKey && !editMode && (
            <>
              <div className="divider" />
              <RowItem
                label="測試 API 連線"
                right={testState === 'testing'
                  ? <RefreshCw size={14} color="#EF9F27" />
                  : testState === 'ok' ? <CheckCircle size={14} color="#2E7D52" />
                    : testState === 'fail' ? <XCircle size={14} color="#E24B4A" />
                      : null}
                onPress={runTest}
              />
              <div className="divider" />
              <RowItem label="更換 API 金鑰" onPress={() => { setEditMode(true); setShowKey(false); }} />
              <div className="divider" />
              <RowItem
                label="刪除 API 金鑰"
                dangerous
                right={<Trash2 size={14} color="#E24B4A" />}
                onPress={deleteKey}
              />
            </>
          )}

          {/* Info */}
          <div style={{ marginTop: 12, padding: 10, background: '#F9F7FF', borderRadius: 10, fontSize: 11, color: '#6B5A9B', lineHeight: 1.6 }}>
            🔒 金鑰僅存於您的裝置。Gemini 1.5 Flash 免費版每天可辨識最多 1,500 張圖片。
          </div>
        </div>

        {/* ─── Data Management ─── */}
        <div className="card">
          <SectionHeader icon={Database} title="資料管理" color="#2E7D52" />

          {/* Storage usage */}
          <div style={{ background: '#F0F8F4', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D52', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
              目前儲存量
            </div>
            {[
              ['食譜', JSON.parse(localStorage.getItem('bb_recipes') || '[]').length, '筆'],
              ['日誌', JSON.parse(localStorage.getItem('bb_journal') || '[]').length, '筆'],
              ['食材庫存', JSON.parse(localStorage.getItem('bb_inventory') || '[]').length, '項'],
            ].map(([label, count, unit]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: '#333' }}>
                <span>{label}</span>
                <span style={{ fontWeight: 700, color: '#2E7D52' }}>{count} {unit}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(46,125,82,0.15)', marginTop: 8, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
              <span>localStorage 佔用</span>
              <span>{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="divider" />

          {/* Reset to sample data */}
          {!resetConfirm ? (
            <RowItem
              label="重置為範例資料"
              value="還原成內建食譜與庫存"
              right={<RefreshCw size={14} color="#EF9F27" />}
              onPress={() => setResetConfirm(true)}
            />
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

          {/* Clear all data */}
          {!clearConfirm ? (
            <RowItem
              label="清除所有資料"
              dangerous
              right={<Trash2 size={14} color="#E24B4A" />}
              onPress={() => setClearConfirm(true)}
            />
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
            ['AI 引擎', 'Google Gemini 1.5 Flash'],
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
