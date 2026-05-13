// src/data/nutritionData.js

// 單位皆為每 100g 或 每 100ml 的營養價值
// 熱量 (kcal), 蛋白質 (g), 脂肪 (g), 飽和脂肪 (g), 反式脂肪 (g), 碳水化合物 (g), 糖 (g), 鈉 (mg)
export const INGREDIENT_NUTRITION = {
  '高筋麵粉': { calories: 350, protein: 13, fat: 1.5, saturatedFat: 0.3, transFat: 0, carbs: 72, sugar: 1, sodium: 2 },
  '中筋麵粉': { calories: 355, protein: 10, fat: 1.2, saturatedFat: 0.2, transFat: 0, carbs: 74, sugar: 1, sodium: 2 },
  '低筋麵粉': { calories: 360, protein: 8,  fat: 1.0, saturatedFat: 0.2, transFat: 0, carbs: 76, sugar: 1, sodium: 2 },
  '溫水':     { calories: 0,   protein: 0,  fat: 0,   saturatedFat: 0,   transFat: 0, carbs: 0,  sugar: 0, sodium: 0 },
  '老麵種':   { calories: 180, protein: 6,  fat: 0.5, saturatedFat: 0.1, transFat: 0, carbs: 38, sugar: 0, sodium: 1 },
  '鹽':       { calories: 0,   protein: 0,  fat: 0,   saturatedFat: 0,   transFat: 0, carbs: 0,  sugar: 0, sodium: 38758 },
  '橄欖油':   { calories: 884, protein: 0,  fat: 100, saturatedFat: 14,  transFat: 0, carbs: 0,  sugar: 0, sodium: 2 },
  '麥芽精':   { calories: 315, protein: 5,  fat: 0,   saturatedFat: 0,   transFat: 0, carbs: 75, sugar: 40, sodium: 10 },
  '雞蛋':     { calories: 143, protein: 12, fat: 9.5, saturatedFat: 3,   transFat: 0, carbs: 1,  sugar: 1, sodium: 142 }, // 假設 1 顆約 50g，這裡用每 100g 計算
  '牛奶':     { calories: 61,  protein: 3,  fat: 3,   saturatedFat: 2,   transFat: 0, carbs: 5,  sugar: 5, sodium: 40 },
  '全脂牛奶': { calories: 61,  protein: 3,  fat: 3,   saturatedFat: 2,   transFat: 0, carbs: 5,  sugar: 5, sodium: 40 },
  '細砂糖':   { calories: 387, protein: 0,  fat: 0,   saturatedFat: 0,   transFat: 0, carbs: 100,sugar: 100,sodium: 1 },
  '無鹽奶油': { calories: 717, protein: 0.8,fat: 81,  saturatedFat: 51,  transFat: 3, carbs: 0,  sugar: 0, sodium: 11 },
  '草莓':     { calories: 32,  protein: 0.7,fat: 0.3, saturatedFat: 0,   transFat: 0, carbs: 8,  sugar: 5, sodium: 1 },
  '即溶酵母粉':{ calories: 381, protein: 44, fat: 5,   saturatedFat: 1,   transFat: 0, carbs: 41, sugar: 0, sodium: 54 },
  '抹茶粉':   { calories: 324, protein: 29, fat: 5,   saturatedFat: 1,   transFat: 0, carbs: 38, sugar: 0, sodium: 4 },
  '蜜紅豆':   { calories: 230, protein: 6,  fat: 0.5, saturatedFat: 0.1, transFat: 0, carbs: 50, sugar: 35, sodium: 10 },
};

// 若未找到對應食材，預設給予 0 避免計算錯誤
export const DEFAULT_NUTRITION = {
  calories: 0, protein: 0, fat: 0, saturatedFat: 0, transFat: 0, carbs: 0, sugar: 0, sodium: 0
};
