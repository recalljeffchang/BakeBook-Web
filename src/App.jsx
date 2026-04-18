// src/App.jsx
import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Home as HomeIcon, BookOpen, Timer as TimerIcon, Camera, Leaf } from 'lucide-react';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import Timer from './pages/Timer';
import Journal from './pages/Journal';
import Inventory from './pages/Inventory';
import RecipeDetail from './pages/RecipeDetail';
import UploadRecipe from './pages/UploadRecipe';

const TABS = [
  { key: 'home',      label: '首頁', Icon: HomeIcon,  color: '#C8A97E' },
  { key: 'recipes',   label: '食譜', Icon: BookOpen,   color: '#C8A97E' },
  { key: 'timer',     label: '計時', Icon: TimerIcon,  color: '#ffffff' },
  { key: 'journal',   label: '日誌', Icon: Camera,     color: '#9E7B55' },
  { key: 'inventory', label: '存量', Icon: Leaf,       color: '#2E7D52' },
];

function AppShell() {
  const { lowStockItems } = useApp();
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // [{page, data}]
  const [timerMinutes, setTimerMinutes] = useState(35);
  const [showTimerModal, setShowTimerModal] = useState(false);

  const navigate = (page, data = null) => setStack(s => [...s, { page, data }]);
  const goBack = () => setStack(s => s.slice(0, -1));

  const openTimer = (minutes) => {
    setTimerMinutes(minutes);
    setShowTimerModal(true);
  };

  // Render top of stack or current tab
  const top = stack[stack.length - 1];

  const renderTab = () => {
    switch (tab) {
      case 'home':      return <Home onNavigate={navigate} />;
      case 'recipes':   return <Recipes onNavigate={navigate} />;
      case 'timer':     return <Timer initialMinutes={timerMinutes} />;
      case 'journal':   return <Journal />;
      case 'inventory': return <Inventory />;
      default: return null;
    }
  };

  const renderStack = () => {
    if (!top) return null;
    switch (top.page) {
      case 'recipe-detail':
        return <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#F2F0EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RecipeDetail recipe={top.data} onBack={goBack} onOpenTimer={openTimer} />
        </div>;
      case 'upload-recipe':
        return <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#F2F0EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <UploadRecipe onBack={goBack} />
        </div>;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      {/* Main content */}
      {renderTab()}

      {/* Stack overlay */}
      {renderStack()}

      {/* Timer modal */}
      {showTimerModal && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#1C1C1E', display: 'flex', flexDirection: 'column' }}>
          <Timer initialMinutes={timerMinutes} onClose={() => setShowTimerModal(false)} />
        </div>
      )}

      {/* Tab bar — only show when no full-screen stack overlay */}
      {stack.length === 0 && (
        <nav className="tab-bar">
          {TABS.map(({ key, label, Icon, color }) => {
            const active = tab === key;
            const showBadge = key === 'inventory' && lowStockItems.length > 0;
            return (
              <button
                key={key}
                className={`tab-btn ${active ? 'active' : ''}`}
                style={{ color: active ? color : '#aaa' }}
                onClick={() => setTab(key)}
              >
                <div style={{ position: 'relative' }}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                  {showBadge && <div className="tab-badge" />}
                </div>
                <span className="tab-label" style={{ color: active ? color : '#aaa' }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
