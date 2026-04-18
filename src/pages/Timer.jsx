// src/pages/Timer.jsx
import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';

const PRESETS = [
  [10, '10分'], [20, '20分'], [35, '35分'], [60, '60分'],
];

export default function Timer({ initialMinutes = 35, onClose }) {
  const [totalSec, setTotalSec] = useState(initialMinutes * 60);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState('烘烤計時');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // If initialMinutes changes (from step card), reset
  useEffect(() => {
    setRunning(false);
    setTotalSec(initialMinutes * 60);
    setRemaining(initialMinutes * 60);
  }, [initialMinutes]);

  const progress = totalSec > 0 ? remaining / totalSec : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const setPreset = (minutes, lbl) => {
    setRunning(false);
    setTotalSec(minutes * 60);
    setRemaining(minutes * 60);
    setLabel(lbl);
  };

  const addMinutes = (m) => {
    const add = m * 60;
    setRemaining(prev => prev + add);
    setTotalSec(prev => Math.max(prev, remaining + add));
  };

  return (
    <div className="timer-page" style={{ padding: `calc(env(safe-area-inset-top,0px) + 52px) 24px 24px`, flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
            ✕ 關閉
          </button>
        )}
        <div style={{ fontSize: 22, fontWeight: 900 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>烘焙計時器</div>
      </div>

      {/* Ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 224, height: 224 }}>
          <svg width="224" height="224" className="timer-ring-svg" style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle cx="112" cy="112" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="112" cy="112" r={radius} fill="none"
              stroke="#C8A97E" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 50, fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>{mm}:{ss}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>剩餘時間</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button className="circle-btn" style={{ width: 60, height: 60, background: '#2C2C2E' }}
            onClick={() => { setRunning(false); setRemaining(totalSec); }}>
            <RotateCcw size={18} />
          </button>
          <button className="circle-btn" style={{ width: 76, height: 76, background: '#C8A97E' }}
            onClick={() => setRunning(prev => !prev)}>
            {running ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} />}
          </button>
          <button className="circle-btn" style={{ width: 60, height: 60, background: '#2C2C2E' }}
            onClick={() => addMinutes(5)}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>+5m</span>
          </button>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {PRESETS.map(([min, lbl]) => (
            <button key={min} className="timer-preset-btn" onClick={() => setPreset(min, `${lbl} 計時`)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
