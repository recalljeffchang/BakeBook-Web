// src/pages/Journal.jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard, SectionLabel, StarRating } from '../components/UI';
import NewJournalModal from './NewJournal';

function emojiFor(name) {
  if (name.includes('麵包')) return '🍞';
  if (name.includes('蛋糕')) return '🎂';
  if (name.includes('餅乾')) return '🍪';
  if (name.includes('饅頭') || name.includes('點心')) return '🧁';
  return '🍞';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
}

function JournalCard({ entry, onClick }) {
  const revenue = entry.soldQuantity * entry.unitPrice;
  const profit = revenue - entry.materialCost;
  return (
    <div className="journal-card" onClick={onClick}>
      <div className="journal-card-images">
        <div className="journal-img-main" style={{ background: '#FEF3E7' }}>{emojiFor(entry.recipeName)}</div>
        <div className="journal-img-side">
          <div className="journal-img-side-cell" style={{ background: '#FFF5E0' }}>🔥</div>
          <div className="journal-img-side-cell" style={{ background: '#F0FFF4' }}>✂️</div>
        </div>
      </div>
      <div className="journal-card-body">
        <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 2 }}>{entry.recipeName}</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{formatDate(entry.date)}</div>

        <div className="stat-row" style={{ marginBottom: 10 }}>
          <StatCard value={entry.quantity} label="件數" valueColor="#9E7B55" />
          <StatCard value={`${Math.round(entry.totalWeightGrams)}g`} label="總重量" valueColor="#9E7B55" />
          {entry.saleEnabled && <StatCard value={`NT$${Math.round(revenue)}`} label="銷售額" valueColor="#3D9E6A" bg="#EAFBF0" />}
        </div>

        <div style={{ fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {entry.note}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <StarRating rating={entry.rating} interactive={false} size={13} />
          {entry.saleEnabled && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3D9E6A' }}>
              每件 NT${Math.round(revenue / entry.soldQuantity || 0)}
            </span>
          )}
        </div>

        {entry.saleEnabled && (
          <div className="revenue-block" style={{ marginTop: 10 }}>
            <div className="revenue-row">
              <span>利潤估算</span>
              <span className="val" style={{ color: profit >= 0 ? '#3D9E6A' : '#E24B4A', fontSize: 15, fontWeight: 900 }}>
                NT$ {Math.round(profit).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JournalDetailModal({ entry, onClose }) {
  const revenue = entry.soldQuantity * entry.unitPrice;
  const profit = revenue - entry.materialCost;
  const margin = revenue > 0 ? Math.round(profit / revenue * 100) : 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: '#9E7B55', padding: '52px 24px 18px', position: 'relative', borderRadius: '24px 24px 0 0' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: 10, padding: '4px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            關閉
          </button>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{entry.recipeName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            {formatDate(entry.date)} &nbsp;
            <StarRating rating={entry.rating} interactive={false} size={12} />
          </div>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Output */}
          <div className="card">
            <SectionLabel text="產出記錄" />
            <div className="stat-row" style={{ marginTop: 10 }}>
              <StatCard value={entry.quantity} label="烘焙件數" valueColor="#9E7B55" />
              <StatCard value={`${Math.round(entry.totalWeightGrams)}g`} label="總重量" valueColor="#9E7B55" />
              {entry.quantity > 0 && entry.totalWeightGrams > 0 &&
                <StatCard value={`${Math.round(entry.totalWeightGrams/entry.quantity)}g`} label="每件重量" valueColor="#9E7B55" />}
            </div>
          </div>

          {/* Sales */}
          {entry.saleEnabled && (
            <div className="card">
              <SectionLabel text="販售資訊" />
              <div className="stat-row" style={{ margin: '10px 0' }}>
                <StatCard value={`${entry.soldQuantity}件`} label="售出數量" valueColor="#9E7B55" />
                <StatCard value={`NT$${Math.round(entry.unitPrice)}`} label="單件售價" valueColor="#9E7B55" />
              </div>
              <div className="revenue-block">
                <div className="revenue-row"><span>銷售收入</span><span className="val">NT$ {Math.round(revenue).toLocaleString()}</span></div>
                <div style={{ height: 1, background: 'rgba(46,125,82,0.2)' }} />
                <div className="revenue-row"><span>材料成本</span><span className="val" style={{ color: '#C0392B' }}>− NT$ {Math.round(entry.materialCost).toLocaleString()}</span></div>
                <div style={{ height: 1, background: 'rgba(46,125,82,0.2)' }} />
                <div className="revenue-row">
                  <span style={{ fontWeight: 900, fontSize: 14 }}>利潤</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: profit >= 0 ? '#3D9E6A' : '#E24B4A' }}>NT$ {Math.round(profit).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#3D9E6A', marginTop: 8 }}>利潤率 {margin}% &nbsp;|&nbsp; {entry.saleNote}</div>
            </div>
          )}

          {/* Note */}
          <div className="card">
            <SectionLabel text="烘焙心得" />
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginTop: 8 }}>{entry.note}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Journal() {
  const { journal, monthlyRevenue, monthlyEntryCount, totalOutputCount } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="page">
      {/* Header */}
      <div className="hero-header" style={{ background: '#9E7B55', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>烘焙日誌</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>記錄每一次的成果與收益</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>本月收益</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>NT$ {Math.round(monthlyRevenue).toLocaleString()}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-row" style={{ padding: '12px 18px 0' }}>
        <StatCard value={monthlyEntryCount} label="本月筆記" valueColor="#9E7B55" />
        <StatCard value={`${totalOutputCount}件`} label="總產出" valueColor="#9E7B55" />
        <StatCard value={`NT$${Math.round(monthlyRevenue / 1000)}K`} label="總銷售額" valueColor="#3D9E6A" bg="#EAFBF0" />
      </div>

      {/* List */}
      <div style={{ padding: '14px 18px 0' }}>
        <SectionLabel text="最近紀錄" />
      </div>
      <div className="list-section">
        {journal.map(entry => (
          <JournalCard key={entry.id} entry={entry} onClick={() => setSelected(entry)} />
        ))}
        {journal.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>還沒有日誌記錄 📓</div>}
      </div>

      {/* FAB */}
      <button className="fab" style={{ background: '#9E7B55' }} onClick={() => setShowNew(true)}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {showNew && <NewJournalModal onClose={() => setShowNew(false)} />}
      {selected && <JournalDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
