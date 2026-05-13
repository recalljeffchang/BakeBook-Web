
$file = "d:\bakebook\src\pages\RecipeDetail.jsx"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# 1. Reset newIngGroup on add
$a = "setNewIngName(''); setNewIngAmount(''); setNewIngUnit('g'); setShowAddIng(false);"
$b = "setNewIngName(''); setNewIngAmount(''); setNewIngUnit('g'); setNewIngGroup(''); setShowAddIng(false);"
$text = $text.Replace($a, $b)

# 2. Include group when adding ingredient
$c = "{ id: uuid(), name: newIngName.trim(), amount: Number(newIngAmount), unit: newIngUnit, isBase: false },"
$d = "{ id: uuid(), name: newIngName.trim(), amount: Number(newIngAmount), unit: newIngUnit, isBase: false, group: newIngGroup.trim() },"
$text = $text.Replace($c, $d)

# 3. Set editIngGroup when entering edit mode
$lf = [char]10
$e = "    setEditIngUnit(ing.unit);" + $lf + "  };"
$f = "    setEditIngUnit(ing.unit);" + $lf + "    setEditIngGroup(ing.group || '');" + $lf + "  };"
# Only replace the first occurrence (handleEditIngredient)
$idx = $text.IndexOf($e)
if ($idx -ge 0) { $text = $text.Substring(0, $idx) + $f + $text.Substring($idx + $e.Length) }

# 4. Include group when updating ingredient
$g = "? { ...i, name: editIngName.trim(), amount: Number(editIngAmount), unit: editIngUnit }"
$h = "? { ...i, name: editIngName.trim(), amount: Number(editIngAmount), unit: editIngUnit, group: editIngGroup.trim() }"
$text = $text.Replace($g, $h)

$newBytes = [System.Text.Encoding]::UTF8.GetBytes($text)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Host "Done. Lines: $(($text -split [char]10).Count)"
