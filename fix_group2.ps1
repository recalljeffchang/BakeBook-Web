
$file = "d:\bakebook\src\pages\RecipeDetail.jsx"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lf = [char]10

# ─────────────────────────────────────────────
# A. Replace the MAIN ingredient TABLE map with a grouped version
# ─────────────────────────────────────────────
$oldTable = @'
          {recipe.ingredients.map((ing, idx) => {
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
'@

$newTable = @'
          {(() => {
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
'@

$text = $text.Replace($oldTable, $newTable)
Write-Host "Table grouped: $($text.Contains('allGroups'))"

# ─────────────────────────────────────────────
# B. Replace the EDIT LIST map with a grouped version
# ─────────────────────────────────────────────
$oldEditList = @'
          {recipe.ingredients.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {recipe.ingredients.map(ing => (
                <div key={ing.id}>
                  {editingIngId === ing.id ? (
'@

$newEditList = @'
          {recipe.ingredients.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {(() => {
                const editGroups = [...new Set(recipe.ingredients.map(i => i.group || ''))];
                return editGroups.map(groupName => {
                  const groupItems = recipe.ingredients.filter(i => (i.group || '') === groupName);
                  return (
                    <div key={groupName || '__no_group__'}>
                      {groupName && (
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#9E6A2A', background: '#FEF3E7', padding: '3px 10px', borderRadius: 6, marginBottom: 4, marginTop: 8 }}>
                          {groupName}
                        </div>
                      )}
                      {groupItems.map(ing => (
                        <div key={ing.id}>
                          {editingIngId === ing.id ? (
'@
$text = $text.Replace($oldEditList, $newEditList)
Write-Host "EditList grouped: $($text.Contains('editGroups'))"

# Also close the extra map/div wrappers we added — find the closing of the edit section
$oldEditClose = @'
              ))}
            </div>
          )}

          {/* ── 新增食材表單 ── */}
'@
$newEditClose = @'
                      ))}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* ── 新增食材表單 ── */}
'@
$text = $text.Replace($oldEditClose, $newEditClose)
Write-Host "EditList close fixed: $($text.Contains('editGroups'))"

# ─────────────────────────────────────────────
# C. Add group input to ADD FORM (after name input, before amount/unit row)
# ─────────────────────────────────────────────
$oldAddForm = @'
              <input
                className="bake-input"
                placeholder="食材名稱，例：高筋麵粉"
                value={newIngName}
                onChange={e => setNewIngName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
'@
$newAddForm = @'
              <datalist id="ing-groups-add">
                {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <input
                className="bake-input"
                placeholder="食材名稱，例：高筋麵粉"
                value={newIngName}
                onChange={e => setNewIngName(e.target.value)}
              />
              <input
                className="bake-input"
                list="ing-groups-add"
                placeholder="分組名稱（選填，例：湯種、主麵團）"
                value={newIngGroup}
                onChange={e => setNewIngGroup(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
'@
$text = $text.Replace($oldAddForm, $newAddForm)
Write-Host "Add form group input: $($text.Contains('ing-groups-add'))"

# ─────────────────────────────────────────────
# D. Add group input to EDIT FORM (after editIngUnit select row)
# ─────────────────────────────────────────────
$oldEditForm = @'
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="bake-input" type="number" value={editIngAmount} onChange={e => setEditIngAmount(e.target.value)} placeholder="數量" style={{ flex: 1 }} />
                        <select className="bake-input" value={editIngUnit} onChange={e => setEditIngUnit(e.target.value)} style={{ width: 70 }}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleUpdateIngredient}
'@
$newEditForm = @'
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="bake-input" type="number" value={editIngAmount} onChange={e => setEditIngAmount(e.target.value)} placeholder="數量" style={{ flex: 1 }} />
                        <select className="bake-input" value={editIngUnit} onChange={e => setEditIngUnit(e.target.value)} style={{ width: 70 }}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <datalist id="ing-groups-edit">
                        {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                      <input className="bake-input" list="ing-groups-edit" placeholder="分組（例：湯種、主麵團）" value={editIngGroup} onChange={e => setEditIngGroup(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={handleUpdateIngredient}
'@
$text = $text.Replace($oldEditForm, $newEditForm)
Write-Host "Edit form group input: $($text.Contains('ing-groups-edit'))"

# Save
$newBytes = [System.Text.Encoding]::UTF8.GetBytes($text)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Host "Saved. Total lines: $(($text -split [char]10).Count)"
