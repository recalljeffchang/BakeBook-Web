// src/pages/InventoryDetail.jsx
import { useApp } from '../context/AppContext';
import { stockStatus, STOCK_STATUS_META, CATEGORY_BG, displayStock, formatAmount } from '../data/models';
import { SectionLabel, ProgressBar, EmojiCircle, TagBadge } from '../components/UI';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function InventoryDetail({ item, onClose }) {
  const status = stockStatus(item);
  const meta = STOCK_STATUS_META[status];
  const pct = item.initialStock > 0 ? Math.min(item.currentStock / item.initialStock, 1) : 0;
  const unitCost = item.initialStock > 0 ? item.purchasePrice / item.initialStock : 0;
  const shortage = Math.max(0, item.minimumThreshold - item.currentStock);
  const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 7 * 86400000);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: '#2E7D52', padding: '48px 24px 18px', borderRadius: '24px 24px 0 0', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', borderRadius: 10, padding: '4px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>關閉</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <EmojiCircle emoji={item.emoji} bg={CATEGORY_BG[item.category] || '#F5F5F5'} size={44} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {item.brand ? `${item.brand}・` : ''}{item.category}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stock status */}
          <div className="card">
            <SectionLabel text="目前存量" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 4px' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: meta.color }}>{formatAmount(item.currentStock)}</span>
              <span style={{ fontSize: 16, color: '#888' }}>{item.unit}</span>
              <div style={{ marginLeft: 'auto' }}>
                <TagBadge text={meta.label} bg={meta.bg} color={meta.textColor} />
              </div>
            </div>
            <ProgressBar value={pct} color={meta.color} height={10} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 6 }}>
              <span>0{item.unit}</span>
              <span style={{ color: meta.color }}>補購門檻 {formatAmount(item.minimumThreshold)}{item.unit}</span>
              <span>{formatAmount(item.initialStock)}{item.unit}（初始）</span>
            </div>
          </div>

          {/* Purchase info */}
          <div className="card">
            <SectionLabel text="購置資訊" />
            {[
              ['購置地點', item.purchaseLocation || '—'],
              ['購買價格', `NT$ ${Math.round(item.purchasePrice)}（${item.totalPieces}件）`],
              ['單位成本', `NT$ ${unitCost.toFixed(4)} / ${item.unit}`],
              ['最後更新', formatDate(item.purchaseDate)],
            ].map(([label, value], i) => (
              <div key={i}>
                {i > 0 && <div className="divider" />}
                <div className="info-row" style={{ padding: '5px 0' }}>
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              </div>
            ))}
            {item.expiryDate && (
              <>
                <div className="divider" />
                <div className="info-row" style={{ padding: '5px 0' }}>
                  <span className="info-label">有效日期</span>
                  <span className="info-value" style={{ color: isExpiringSoon ? '#E24B4A' : 'inherit' }}>{formatDate(item.expiryDate)}</span>
                </div>
              </>
            )}
          </div>

          {/* Repurchase warning */}
          {status !== 'ok' && (
            <div style={{ background: '#FCEBEB', borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#791F1F', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠ 補購建議
              </div>
              <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 10 }}>
                存量低於門檻，差額 {formatAmount(shortage)}{item.unit}，建議補購。
              </div>
              <div style={{ background: 'white', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: '#888' }}>建議補購</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#E24B4A' }}>
                  {formatAmount(item.minimumThreshold)}{item.unit}（約 NT${Math.round(item.minimumThreshold * unitCost)}）
                </div>
                {item.purchaseLocation && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{item.purchaseLocation}</div>}
              </div>
            </div>
          )}

          {/* Usage log */}
          <div className="card">
            <SectionLabel text="使用記錄" />
            {item.usageLog.length === 0 ? (
              <div style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>尚無記錄</div>
            ) : (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {item.usageLog.map((log, i) => (
                  <div key={log.id}>
                    {i > 0 && <div className="divider" />}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: log.change > 0 ? '#EAFBF0' : '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {log.change > 0 ? '⬇️' : '⬆️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{log.reason}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{formatDate(log.date)}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: log.change > 0 ? '#3D9E6A' : '#E24B4A', flexShrink: 0 }}>
                        {log.change > 0 ? '+' : ''}{log.change.toFixed(1).replace(/\.0$/, '')}{item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
