// src/pages/Inventory.jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { stockStatus, STOCK_STATUS_META, INGREDIENT_CATEGORIES, CATEGORY_BG, CATEGORY_EMOJI, displayStock, formatAmount } from '../data/models';
import { StatCard, SectionLabel, EmojiCircle, TagBadge, ProgressBar } from '../components/UI';
import AddInventoryModal from './AddInventory';
import InventoryDetail from './InventoryDetail';

function InventoryItemCard({ item, onClick }) {
  const status = stockStatus(item);
  const meta = STOCK_STATUS_META[status];
  const pct = item.initialStock > 0 ? Math.min(item.currentStock / item.initialStock, 1) : 0;

  return (
    <div className="inv-card" onClick={onClick}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <EmojiCircle emoji={item.emoji} bg={CATEGORY_BG[item.category] || '#F5F5F5'} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{item.purchaseLocation || item.category}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: meta.color }}>{displayStock(item)}</div>
          <div style={{ fontSize: 11, color: '#888' }}>最低 {formatAmount(item.minimumThreshold)}{item.unit}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ProgressBar value={pct} color={meta.color} />
        <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, width: 36, textAlign: 'right' }}>{Math.round(pct * 100)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {item.purchasePrice > 0 && <TagBadge text={`NT$${Math.round(item.purchasePrice)}`} bg="#FEF3E7" color="#633806" />}
        {item.purchaseLocation && <TagBadge text={item.purchaseLocation} bg="#EAF3DE" color="#27500A" />}
        {status !== 'ok' && <TagBadge text={meta.label} bg={meta.bg} color={meta.textColor} />}
      </div>
    </div>
  );
}

export default function Inventory() {
  const { inventory, lowStockItems, totalInventoryValue } = useApp();
  const [selectedCat, setSelectedCat] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filtered = inventory.filter(item =>
    !selectedCat || item.category === selectedCat
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="hero-header" style={{ background: '#2E7D52', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>食材存量</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>管理烘焙食材庫存</div>
        </div>
        {lowStockItems.length > 0 && (
          <span style={{ background: '#E24B4A', color: 'white', fontSize: 11, fontWeight: 900, padding: '5px 12px', borderRadius: 20 }}>
            ⚠ {lowStockItems.length} 項不足
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="stat-row" style={{ padding: '12px 18px 0' }}>
        <StatCard value={inventory.length} label="食材種類" valueColor="#2E7D52" />
        <StatCard
          value={lowStockItems.length}
          label="需補購"
          valueColor={lowStockItems.length === 0 ? '#2E7D52' : '#E24B4A'}
          bg={lowStockItems.length === 0 ? 'white' : '#FCEBEB'}
        />
        <StatCard value={`NT$${Math.round(totalInventoryValue)}`} label="庫存估值" valueColor="#2E7D52" />
      </div>

      {/* Alert banner */}
      {lowStockItems.length > 0 && (
        <div style={{ padding: '14px 18px 0' }}>
          <div className="alert-banner">
            <span style={{ fontSize: 20 }}>🔔</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#791F1F', marginBottom: 4 }}>存量不足提醒</div>
              {lowStockItems.map(item => (
                <div key={item.id} style={{ fontSize: 12, color: '#A32D2D', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} />
                  {item.name} — 剩 {displayStock(item)}，最低需求 {formatAmount(item.minimumThreshold)}{item.unit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="pill-row" style={{ padding: '14px 18px' }}>
        <button className="pill" onClick={() => setSelectedCat(null)}
          style={{ background: !selectedCat ? '#2E7D52' : 'white', color: !selectedCat ? 'white' : '#5a5a5a' }}>全部</button>
        {INGREDIENT_CATEGORIES.map(cat => (
          <button key={cat} className="pill"
            onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
            style={{ background: selectedCat === cat ? '#2E7D52' : 'white', color: selectedCat === cat ? 'white' : '#5a5a5a' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="list-section" style={{ paddingTop: 0 }}>
        {filtered.map(item => (
          <InventoryItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>沒有食材記錄 🧺</div>}
      </div>

      {/* FAB */}
      <button className="fab" style={{ background: '#2E7D52' }} onClick={() => setShowAdd(true)}>
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {showAdd && <AddInventoryModal onClose={() => setShowAdd(false)} />}
      {selectedItem && <InventoryDetail item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
