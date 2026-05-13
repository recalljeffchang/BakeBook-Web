const fs = require('fs');
const file = 'd:/bakebook/src/pages/RecipeDetail.jsx';
let text = fs.readFileSync(file, 'utf8');

// ─── A. Replace main ingredient TABLE map with grouped version ───
const tblStart = text.indexOf('          {recipe.ingredients.map((ing, idx) => {');
const tblEnd   = text.indexOf('          {hydrationRate > 0 && (');
if (tblStart < 0 || tblEnd < 0) { console.log('A: anchors not found'); }
else {
  const newTable = `          {(() => {
            const allGroups = [...new Set(recipe.ingredients.map(i => i.group || ''))];
            return allGroups.map(groupName => {
              const groupItems = recipe.ingredients
                .map((ing, idx) => ({ ing, idx }))
                .filter(({ ing }) => (ing.group || '') === groupName);
              return (
                <div key={groupName || '__no_group__'}>
                  {groupName && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#9E6A2A', background: '#FEF3E7', padding: '3px 10px', borderRadius: 6, marginTop: 10, marginBottom: 4 }}>
                      {groupName}
                    </div>
                  )}
                  {groupItems.map(({ ing, idx }) => {
                    const s = scaled[idx];
                    const isBase = idx === baseIdx;
                    return (
                      <div key={ing.id}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isBase ? '#E8963A' : '#C8A97E', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: isBase ? 700 : 600, color: isBase ? '#9E6A2A' : '#1a1a1a' }}>{ing.name}</span>
                            {isBase && <TagBadge text="基準" bg="#FEF3E7" color="#9E6A2A" />}
                          </div>
                          <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#888' }}>{formatAmount(ing.amount)}{ing.unit}</span>
                          <span style={{ width: 70, textAlign: 'right', fontSize: 14, fontWeight: 900, color: isBase ? '#E8963A' : '#C8A97E' }}>
                            {formatAmount(s.scaledAmount)}{ing.unit}
                          </span>
                        </div>
                        <Divider />
                      </div>
                    );
                  })}
                </div>
              );
            });
          })()}
`;
  text = text.substring(0, tblStart) + newTable + text.substring(tblEnd);
  console.log('A: Table grouped OK');
}

// ─── B. Add group input after name input in ADD FORM ───
const addNameClose = `                onChange={e => setNewIngName(e.target.value)}\n              />`;
const addNameIdx = text.indexOf(addNameClose);
if (addNameIdx < 0) { console.log('B: add form anchor not found'); }
else {
  const insertPos = addNameIdx + addNameClose.length;
  const groupInput = `\n              <datalist id="ing-groups-add">\n                {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (\n                  <option key={g} value={g} />\n                ))}\n              </datalist>\n              <input className="bake-input" list="ing-groups-add" placeholder="分組（選填，例：湯種、主麵團）" value={newIngGroup} onChange={e => setNewIngGroup(e.target.value)} />`;
  text = text.substring(0, insertPos) + groupInput + text.substring(insertPos);
  console.log('B: Add form group input OK');
}

// ─── C. Add group input after editIngUnit select in EDIT FORM ───
const editUnitClose = `                          {UNITS.map(u => <option key={u}>{u}</option>)}\n                        </select>\n                      </div>`;
const editUnitIdx = text.indexOf(editUnitClose);
if (editUnitIdx < 0) { console.log('C: edit form anchor not found'); }
else {
  const insertPos2 = editUnitIdx + editUnitClose.length;
  const editGroupInput = `\n                      <datalist id="ing-groups-edit">\n                        {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (\n                          <option key={g} value={g} />\n                        ))}\n                      </datalist>\n                      <input className="bake-input" list="ing-groups-edit" placeholder="分組（例：湯種）" value={editIngGroup} onChange={e => setEditIngGroup(e.target.value)} />`;
  text = text.substring(0, insertPos2) + editGroupInput + text.substring(insertPos2);
  console.log('C: Edit form group input OK');
}

fs.writeFileSync(file, text, 'utf8');
console.log('Saved. Lines:', text.split('\n').length);
