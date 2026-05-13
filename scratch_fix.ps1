$bytes = [System.IO.File]::ReadAllBytes("d:\bakebook\src\pages\RecipeDetail.jsx")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$old3 = "    dispatch({ type: 'UPDATE_RECIPE', payload: updated });" + [char]10 + "    setNewIngName(''); setNewIngAmount(''); setNewIngUnit('g'); setShowAddIng(false);"
$new3 = "    dispatch({ type: 'UPDATE_RECIPE', payload: updated });" + [char]10 + "    setNewIngName(''); setNewIngAmount(''); setNewIngUnit('g'); setNewIngGroup(''); setShowAddIng(false);"
$text = $text.Replace($old3, $new3)
Write-Host "Reset: $($text.Contains("setNewIngGroup('')"))"

$old4 = "{ id: uuid(), name: newIngName.trim(), amount: Number(newIngAmount), unit: newIngUnit, isBase: false },"
$new4 = "{ id: uuid(), name: newIngName.trim(), amount: Number(newIngAmount), unit: newIngUnit, isBase: false, group: newIngGroup.trim() || '' },"
$text = $text.Replace($old4, $new4)
Write-Host "AddGroup: $($text.Contains('group: newIngGroup.trim()'))"

$old5 = "  const handleEditIngredient = (ing) => {" + [char]10 + "    setEditingIngId(ing.id);" + [char]10 + "    setEditIngName(ing.name);" + [char]10 + "    setEditIngAmount(String(ing.amount));" + [char]10 + "    setEditIngUnit(ing.unit);" + [char]10 + "  };"
$new5 = "  const handleEditIngredient = (ing) => {" + [char]10 + "    setEditingIngId(ing.id);" + [char]10 + "    setEditIngName(ing.name);" + [char]10 + "    setEditIngAmount(String(ing.amount));" + [char]10 + "    setEditIngUnit(ing.unit);" + [char]10 + "    setEditIngGroup(ing.group || '');" + [char]10 + "  };"
$text = $text.Replace($old5, $new5)
Write-Host "EditHandler: $($text.Contains('setEditIngGroup(ing.group'))"

$old6 = "? { ...i, name: editIngName.trim(), amount: Number(editIngAmount), unit: editIngUnit }"
$new6 = "? { ...i, name: editIngName.trim(), amount: Number(editIngAmount), unit: editIngUnit, group: editIngGroup.trim() || '' }"
$text = $text.Replace($old6, $new6)
Write-Host "UpdateHandler: $($text.Contains('editIngGroup.trim()'))"

[System.IO.File]::WriteAllBytes("d:\bakebook\src\pages\RecipeDetail.jsx", [System.Text.Encoding]::UTF8.GetBytes($text))
Write-Host "Done."