// src/components/LoginBanner.jsx
// Cloud sync login banner — shown at top of Home page

import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function LoginBanner() {
  const { user, isLoggedIn, loginWithGoogle, logout, loading, error } = useAuth();
  const { syncStatus, lastSyncTime } = useApp();

  if (loading) return null;

  // ── Logged in state ──
  if (isLoggedIn) {
    const syncLabel = syncStatus === 'syncing' ? '同步中...'
      : syncStatus === 'synced' ? '已同步 ✓'
      : syncStatus === 'error' ? '同步失敗'
      : '';

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', margin: '0 18px 0',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 14, backdropFilter: 'blur(8px)',
      }}>
        <img
          src={user.photoURL || ''}
          alt=""
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
            {user.displayName || '已登入'}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
            ☁️ {syncLabel}
            {lastSyncTime && syncStatus === 'synced' && (
              <span> · {new Date(lastSyncTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '5px 12px', background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
            color: 'white', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          登出
        </button>
      </div>
    );
  }

  // ── Not logged in ──
  return (
    <div style={{
      margin: '0 18px 0',
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.12)',
      borderRadius: 14, backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
            ☁️ 雲端同步
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            登入 Google 帳號即可跨裝置同步
          </div>
        </div>
        <button
          onClick={loginWithGoogle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: 'white',
            border: 'none', borderRadius: 10,
            color: '#333', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 登入
        </button>
      </div>
      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#FCEBEB', padding: '6px 10px', background: 'rgba(226,75,74,0.3)', borderRadius: 8 }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
