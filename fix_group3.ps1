
$file = "d:\bakebook\src\pages\RecipeDetail.jsx"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$lf = [char]10
$cr = [char]13

# ─── A. Replace the main ingredient TABLE map ───
# Find exact bounds using unique anchors
$tblStart = $text.IndexOf("          {recipe.ingredients.map((ing, idx) => {")
$tblEnd   = $text.IndexOf("          {hydrationRate > 0 && (")

$oldTable = $text.Substring($tblStart, $tblEnd - $tblStart)

$newTable = "          {(() => {" + $lf +
"            const allGroups = [...new Set(recipe.ingredients.map(i => i.group || ''))];" + $lf +
"            return allGroups.map(groupName => {" + $lf +
"              const groupItems = recipe.ingredients" + $lf +
"                .map((ing, idx) => ({ ing, idx }))" + $lf +
"                .filter(({ ing }) => (ing.group || '') === groupName);" + $lf +
"              return (" + $lf +
"                <div key={groupName || '__no_group__'}>" + $lf +
"                  {groupName && (" + $lf +
"                    <div style={{ fontSize: 11, fontWeight: 800, color: '#9E6A2A', background: '#FEF3E7', padding: '3px 10px', borderRadius: 6, marginTop: 10, marginBottom: 4 }}>" + $lf +
"                      {groupName}" + $lf +
"                    </div>" + $lf +
"                  )}" + $lf +
"                  {groupItems.map(({ ing, idx }) => {" + $lf +
"                    const s = scaled[idx];" + $lf +
"                    const isBase = idx === baseIdx;" + $lf +
"                    return (" + $lf +
"                      <div key={ing.id}>" + $lf +
"                        <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0' }}>" + $lf +
"                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>" + $lf +
"                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isBase ? '#E8963A' : '#C8A97E', flexShrink: 0 }} />" + $lf +
"                            <span style={{ fontSize: 13, fontWeight: isBase ? 700 : 600, color: isBase ? '#9E6A2A' : '#1a1a1a' }}>{ing.name}</span>" + $lf +
"                            {isBase && <TagBadge text=" + [char]34 + "基準" + [char]34 + " bg=" + [char]34 + "#FEF3E7" + [char]34 + " color=" + [char]34 + "#9E6A2A" + [char]34 + " />}" + $lf +
"                          </div>" + $lf +
"                          <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#888' }}>{formatAmount(ing.amount)}{ing.unit}</span>" + $lf +
"                          <span style={{ width: 70, textAlign: 'right', fontSize: 14, fontWeight: 900, color: isBase ? '#E8963A' : '#C8A97E' }}>" + $lf +
"                            {formatAmount(s.scaledAmount)}{ing.unit}" + $lf +
"                          </span>" + $lf +
"                        </div>" + $lf +
"                        <Divider />" + $lf +
"                      </div>" + $lf +
"                    );" + $lf +
"                  })}" + $lf +
"                </div>" + $lf +
"              );" + $lf +
"            });" + $lf +
"          })()}" + $lf

$text = $text.Substring(0, $tblStart) + $newTable + $text.Substring($tblEnd)
Write-Host "A. Table grouped: $($text.Contains('allGroups'))"

# ─── B. Add group input to the ADD FORM ───
# Find after name input closing />
$addNameEnd = $text.IndexOf("                onChange={e => setNewIngName(e.target.value)}" + $lf + "              />")
$insertAfter = $addNameEnd + ("                onChange={e => setNewIngName(e.target.value)}" + $lf + "              />").Length

$groupInput = $lf +
"              <datalist id=" + [char]34 + "ing-groups-add" + [char]34 + ">" + $lf +
"                {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (" + $lf +
"                  <option key={g} value={g} />" + $lf +
"                ))}" + $lf +
"              </datalist>" + $lf +
"              <input className=" + [char]34 + "bake-input" + [char]34 + " list=" + [char]34 + "ing-groups-add" + [char]34 + " placeholder=" + [char]34 + "分組（選填，例：湯種、主麵團）" + [char]34 + " value={newIngGroup} onChange={e => setNewIngGroup(e.target.value)} />"

$text = $text.Substring(0, $insertAfter) + $groupInput + $text.Substring($insertAfter)
Write-Host "B. Add form group: $($text.Contains('ing-groups-add'))"

# ─── C. Add group input to EDIT FORM (after the editIngUnit select) ───
# Find the unique close of the amount/unit row inside the edit form
$editUnitClose = "                          {UNITS.map(u => <option key={u}>{u}</option>)}" + $lf +
"                        </select>" + $lf +
"                      </div>"

$editInsertIdx = $text.IndexOf($editUnitClose) + $editUnitClose.Length

$editGroupInput = $lf +
"                      <datalist id=" + [char]34 + "ing-groups-edit" + [char]34 + ">" + $lf +
"                        {[...new Set(recipe.ingredients.map(i => i.group).filter(Boolean))].map(g => (" + $lf +
"                          <option key={g} value={g} />" + $lf +
"                        ))}" + $lf +
"                      </datalist>" + $lf +
"                      <input className=" + [char]34 + "bake-input" + [char]34 + " list=" + [char]34 + "ing-groups-edit" + [char]34 + " placeholder=" + [char]34 + "分組（例：湯種）" + [char]34 + " value={editIngGroup} onChange={e => setEditIngGroup(e.target.value)} />"

$text = $text.Substring(0, $editInsertIdx) + $editGroupInput + $text.Substring($editInsertIdx)
Write-Host "C. Edit form group: $($text.Contains('ing-groups-edit'))"

# ─── Save ───
$newBytes = [System.Text.Encoding]::UTF8.GetBytes($text)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Host "Saved. Lines: $(($text -split $lf).Count)"
