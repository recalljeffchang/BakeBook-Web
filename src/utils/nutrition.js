// src/utils/nutrition.js
import { INGREDIENT_NUTRITION, DEFAULT_NUTRITION } from '../data/nutritionData';

/**
 * 依據食譜與日誌計算營養標示數據
 * @param {Object} recipe - 食譜物件，必須包含 ingredients
 * @param {Object} entry - 日誌物件，用於取得最終成品重量 (totalWeightGrams) 與產出件數 (quantity)
 */
export function calculateNutrition(recipe, entry) {
  if (!recipe || !recipe.ingredients) return null;

  let totalMacros = {
    calories: 0, protein: 0, fat: 0, saturatedFat: 0, transFat: 0, carbs: 0, sugar: 0, sodium: 0
  };

  let sumRawWeight = 0;

  // 計算所有食材的總營養素
  recipe.ingredients.forEach(ing => {
    let weightInGrams = 0;
    if (ing.unit === 'g' || ing.unit === 'ml') {
      weightInGrams = Number(ing.amount) || 0;
    } else if (ing.unit === '顆') {
      // 假設每顆蛋或每顆材料約 50g
      weightInGrams = (Number(ing.amount) || 0) * 50;
    } else if (ing.unit === 'kg') {
      weightInGrams = (Number(ing.amount) || 0) * 1000;
    }

    sumRawWeight += weightInGrams;
    const nutritionInfo = INGREDIENT_NUTRITION[ing.name] || DEFAULT_NUTRITION;

    const ratio = weightInGrams / 100;
    totalMacros.calories += nutritionInfo.calories * ratio;
    totalMacros.protein += nutritionInfo.protein * ratio;
    totalMacros.fat += nutritionInfo.fat * ratio;
    totalMacros.saturatedFat += nutritionInfo.saturatedFat * ratio;
    totalMacros.transFat += nutritionInfo.transFat * ratio;
    totalMacros.carbs += nutritionInfo.carbs * ratio;
    totalMacros.sugar += nutritionInfo.sugar * ratio;
    totalMacros.sodium += nutritionInfo.sodium * ratio;
  });

  // 如果日誌沒有紀錄總重量，就以生麵團(食材總重)作為基準
  const finalWeight = (entry && entry.totalWeightGrams > 0) ? entry.totalWeightGrams : sumRawWeight;
  if (finalWeight === 0) return null;

  // 決定包裝份數與每一份量
  const quantity = (entry && entry.quantity > 0) ? entry.quantity : 1;
  const servingSize = finalWeight / quantity;

  // 換算比例
  const per100gRatio = 100 / finalWeight;
  const perServingRatio = servingSize / finalWeight;

  // 依據食藥署「包裝食品營養標示應遵行事項」進行數據修整
  const roundTo = (num, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  };

  const formatMacro = (key, val, raw100gVal, raw100gFat) => {
    if (val === null || val === undefined || isNaN(val)) return 0;
    
    if (key === 'calories') {
      // 熱量 <= 5 得標示為 0
      return val <= 5 ? 0 : roundTo(val, 1);
    }
    if (key === 'sodium') {
      // 鈉 < 5 得標示為 0
      return val < 5 ? 0 : Math.round(val);
    }
    if (key === 'transFat') {
      // 反式脂肪「0」標示條件僅限以「每100公克」檢視
      // 若每100公克總脂肪 <= 1.0 或 每100公克反式脂肪 <= 0.3，則無論是每份或每100g皆得標示為 0
      if (raw100gFat <= 1.0 || raw100gVal <= 0.3) return 0;
      return roundTo(val, 1);
    }
    // 蛋白質、脂肪、飽和脂肪、碳水化合物、糖
    return val < 0.5 ? 0 : roundTo(val, 1);
  };

  const rawPer100g = {};
  const rawPerServing = {};
  const per100g = {};
  const perServing = {};

  Object.keys(totalMacros).forEach(key => {
    rawPer100g[key] = totalMacros[key] * per100gRatio;
    rawPerServing[key] = totalMacros[key] * perServingRatio;
  });

  Object.keys(totalMacros).forEach(key => {
    per100g[key] = formatMacro(key, rawPer100g[key], rawPer100g[key], rawPer100g.fat);
    perServing[key] = formatMacro(key, rawPerServing[key], rawPer100g[key], rawPer100g.fat);
  });

  // 每一份量與份數也依規定修整 (至小數點第一位)
  let formattedServingSize = roundTo(servingSize, 1);
  if (formattedServingSize === 0) formattedServingSize = roundTo(servingSize, 2);
  const formattedServingsPerContainer = roundTo(quantity, 1);

  return {
    servingSize: formattedServingSize,
    servingsPerContainer: formattedServingsPerContainer,
    perServing,
    per100g
  };
}

/**
 * 依據食材清單與份量計算營養標示（不需日誌物件）
 * 適用於 RecipeDetail 頁面即時計算（含滑桿調整後用量）
 * 計算方式依據食藥署「包裝食品營養標示應遵行事項」
 * @param {Array} ingredients - 食材陣列，每項含 { name, amount, unit }
 * @param {number} servings - 份數
 */
export function calculateNutritionFromIngredients(ingredients, servings = 1) {
  if (!ingredients || ingredients.length === 0) return null;

  // 構建一個虛擬 recipe 物件供 calculateNutrition 使用
  const pseudoRecipe = { ingredients };
  const pseudoEntry = { totalWeightGrams: 0, quantity: servings };
  return calculateNutrition(pseudoRecipe, pseudoEntry);
}
