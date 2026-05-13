// src/components/NutritionLabel.jsx
// 依據食藥署「包裝食品營養標示應遵行事項」格式
// Reference: 食品標示法規指引手冊

/**
 * 每日參考值 (Daily Reference Values)
 * 依據食藥署規定：
 * 熱量 2000 大卡、蛋白質 60 公克、脂肪 60 公克、
 * 飽和脂肪 18 公克、碳水化合物 300 公克、鈉 2000 毫克
 * 糖、反式脂肪：*參考值未訂定
 */
const DAILY_REF = {
  calories: 2000,
  protein: 60,
  fat: 60,
  saturatedFat: 18,
  transFat: null,     // *參考值未訂定
  carbs: 300,
  sugar: null,        // *參考值未訂定
  sodium: 2000,
};

function formatVal(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num.toFixed(1)).toString();
}

function dailyPct(key, perServingVal) {
  const ref = DAILY_REF[key];
  if (!ref) return '*';
  const pct = (perServingVal / ref) * 100;
  return pct < 1 ? '< 1' : Math.round(pct).toString();
}

function pctDisplay(key, perServingVal) {
  const val = dailyPct(key, perServingVal);
  return val === '*' ? '*' : `${val} %`;
}

// ─── Styled table row ───────────────────────────────────────────────
function NRow({ label, value, unit, pct, indent, bold, borderTop }) {
  return (
    <tr style={{
      borderTop: borderTop ? '1px solid #333' : 'none',
    }}>
      <td style={{
        padding: '5px 0', paddingLeft: indent ? '1.2em' : 0,
        fontWeight: bold ? 700 : 400, fontSize: 13,
      }}>
        {label}
      </td>
      <td style={{ textAlign: 'right', padding: '5px 0', fontSize: 13, whiteSpace: 'nowrap' }}>
        {value} {unit}
      </td>
      <td style={{ textAlign: 'right', padding: '5px 4px', fontSize: 13, whiteSpace: 'nowrap' }}>
        {pct}
      </td>
    </tr>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function NutritionLabel({ data, recipeName, ingredients, servings, netWeight }) {
  if (!data) return null;

  const { servingSize, servingsPerContainer, perServing } = data;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      fontFamily: '"Helvetica Neue", Helvetica, Arial, "PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif',
    }}>
      {/* ── Product info card ── */}
      <div style={{
        background: '#FBF8F4', borderRadius: 12, padding: '12px 14px',
        fontSize: 13, lineHeight: 1.8, color: '#333',
      }}>
        <div><strong>品　名：</strong>{recipeName || '—'}</div>
        <div><strong>內容物：</strong>{ingredients || '—'}</div>
        <div><strong>製造日期：</strong>{new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
        <div><strong>淨　重：</strong>{netWeight || Math.round(servingSize * servingsPerContainer)} 公克</div>
      </div>

      {/* ── Nutrition label table ── */}
      <div style={{
        border: '3px solid #1a1a1a',
        padding: '2px 6px 8px',
        background: 'white', color: 'black',
        width: '100%', boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{
          fontSize: 18, fontWeight: 900, textAlign: 'center',
          borderBottom: '1px solid #1a1a1a', padding: '6px 0 4px',
          letterSpacing: 8,
        }}>
          營 養 標 示
        </div>

        {/* Serving info */}
        <div style={{
          fontSize: 13, lineHeight: 1.6, padding: '4px 0',
          borderBottom: '2px solid #1a1a1a',
        }}>
          每一份量　{formatVal(servingSize)} 公克<br />
          本包裝含　{formatVal(servingsPerContainer)} 份
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1a1a1a' }}>
              <th style={{ textAlign: 'left', padding: '5px 0', fontWeight: 400, fontSize: 13 }}></th>
              <th style={{ textAlign: 'right', padding: '5px 0', fontWeight: 700, fontSize: 13 }}>每份</th>
              <th style={{ textAlign: 'right', padding: '5px 4px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>每日參考值百分比</th>
            </tr>
          </thead>
          <tbody>
            <NRow label="熱量" value={formatVal(perServing.calories)} unit="大卡"
                  pct={pctDisplay('calories', perServing.calories)} bold borderTop />
            <NRow label="蛋白質" value={formatVal(perServing.protein)} unit="公克"
                  pct={pctDisplay('protein', perServing.protein)} borderTop />
            <NRow label="脂肪" value={formatVal(perServing.fat)} unit="公克"
                  pct={pctDisplay('fat', perServing.fat)} borderTop />
            <NRow label="飽和脂肪" value={formatVal(perServing.saturatedFat)} unit="公克"
                  pct={pctDisplay('saturatedFat', perServing.saturatedFat)} indent borderTop />
            <NRow label="反式脂肪" value={formatVal(perServing.transFat)} unit="公克"
                  pct="*" indent borderTop />
            <NRow label="碳水化合物" value={formatVal(perServing.carbs)} unit="公克"
                  pct={pctDisplay('carbs', perServing.carbs)} borderTop />
            <NRow label="糖" value={formatVal(perServing.sugar)} unit="公克"
                  pct="*" indent borderTop />
            <NRow label="鈉" value={formatVal(perServing.sodium)} unit="毫克"
                  pct={pctDisplay('sodium', perServing.sodium)} borderTop />
          </tbody>
        </table>
      </div>
    </div>
  );
}
