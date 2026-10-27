import { ProductDocument } from './data/seedData.ts';

export interface CalculationResult {
  product: ProductDocument;
  calculationType: 'price_for_quantity' | 'quantity_for_money';
  inputQuery?: string;
  // For price_for_quantity:
  requestedQuantity?: number;
  requestedUnit?: string;
  calculatedPrice?: number;
  priceFormatted?: string;
  // For quantity_for_money:
  budgetAmount?: number;
  calculatedQuantityBase?: number;
  displayQuantity?: string;
  breakdown: string;
}

// Unit multipliers to convert input unit to standard base unit:
// Weight base: "kg"
const WEIGHT_TO_KG: Record<string, number> = {
  kg: 1,
  kilo: 1,
  kilos: 1,
  kilogram: 1,
  kilograms: 1,
  g: 0.001,
  gm: 0.001,
  gms: 0.001,
  gram: 0.001,
  grams: 0.001,
  mg: 0.000001,
  milligram: 0.000001,
  milligrams: 0.000001,
  quintal: 100,
  quintals: 100,
  ton: 1000,
  tons: 1000,
  lb: 0.453592,
  lbs: 0.453592,
  pound: 0.453592,
  pounds: 0.453592,
  pao: 0.25, // Indian traditional unit ~250g
};

// Volume base: "liter"
const VOLUME_TO_LITER: Record<string, number> = {
  l: 1,
  lt: 1,
  ltr: 1,
  liter: 1,
  liters: 1,
  litre: 1,
  litres: 1,
  ml: 0.001,
  milliliter: 0.001,
  milliliters: 0.001,
  millilitre: 0.001,
  millilitres: 0.001,
  cc: 0.001,
};

// Count base: "dozen"
const COUNT_TO_DOZEN: Record<string, number> = {
  dozen: 1,
  dozens: 1,
  dz: 1,
  piece: 1 / 12,
  pieces: 1 / 12,
  egg: 1 / 12,
  eggs: 1 / 12,
  item: 1 / 12,
  items: 1 / 12,
  unit: 1 / 12,
  units: 1 / 12,
};

// Count base: "piece" or "packet"
const COUNT_TO_UNIT: Record<string, number> = {
  piece: 1,
  pieces: 1,
  pc: 1,
  pcs: 1,
  packet: 1,
  packets: 1,
  pkt: 1,
  pack: 1,
  packs: 1,
  unit: 1,
  units: 1,
  box: 1,
  boxes: 1,
};

/**
 * Normalizes unit strings (e.g. "500gms" -> { qty: 500, unit: "grams" })
 */
export function normalizeUnit(raw: string): string {
  const clean = raw.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(clean)) return 'g';
  if (['kg', 'kilo', 'kilos', 'kilogram', 'kilograms'].includes(clean)) return 'kg';
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(clean)) return 'ml';
  if (['l', 'lt', 'ltr', 'liter', 'liters', 'litre', 'litres'].includes(clean)) return 'liter';
  if (['dozen', 'dozens', 'dz'].includes(clean)) return 'dozen';
  if (['piece', 'pieces', 'pc', 'pcs', 'egg', 'eggs', 'item', 'items', 'unit', 'units'].includes(clean)) return 'piece';
  if (['packet', 'packets', 'pkt', 'pack', 'packs'].includes(clean)) return 'packet';
  return clean;
}

/**
 * Calculate price for a requested quantity of a product
 */
export function calculatePriceForQuantity(
  product: ProductDocument,
  quantity: number,
  inputUnit: string
): CalculationResult {
  const normUnit = normalizeUnit(inputUnit);
  let multiplier = 1;
  let isValidUnit = false;

  if (product.unit === 'kg') {
    if (WEIGHT_TO_KG[normUnit] !== undefined) {
      multiplier = WEIGHT_TO_KG[normUnit];
      isValidUnit = true;
    }
  } else if (product.unit === 'liter') {
    if (VOLUME_TO_LITER[normUnit] !== undefined) {
      multiplier = VOLUME_TO_LITER[normUnit];
      isValidUnit = true;
    }
  } else if (product.unit === 'dozen') {
    if (COUNT_TO_DOZEN[normUnit] !== undefined) {
      multiplier = COUNT_TO_DOZEN[normUnit];
      isValidUnit = true;
    }
  } else {
    // piece or packet
    if (COUNT_TO_UNIT[normUnit] !== undefined) {
      multiplier = COUNT_TO_UNIT[normUnit];
      isValidUnit = true;
    }
  }

  // Fallback: If unit was unspecified or general "units"
  if (!isValidUnit) {
    if (normUnit === 'half') {
      multiplier = 0.5;
    } else if (normUnit === 'quarter') {
      multiplier = 0.25;
    } else {
      multiplier = 1;
    }
  }

  const baseUnitsRequested = quantity * multiplier;
  const calculatedPrice = Number((baseUnitsRequested * product.price).toFixed(2));

  let breakdown = `Base price: ₹${product.price} per 1 ${product.unit}. `;
  if (multiplier !== 1) {
    breakdown += `${quantity} ${inputUnit} = ${baseUnitsRequested.toFixed(3)} ${product.unit} × ₹${product.price} = ₹${calculatedPrice}`;
  } else {
    breakdown += `${quantity} ${product.unit} × ₹${product.price} = ₹${calculatedPrice}`;
  }

  return {
    product,
    calculationType: 'price_for_quantity',
    requestedQuantity: quantity,
    requestedUnit: inputUnit,
    calculatedPrice,
    priceFormatted: `₹${calculatedPrice.toFixed(2)}`,
    breakdown,
  };
}

/**
 * Calculate how much quantity can be purchased for a given budget in Rupees
 */
export function calculateQuantityForBudget(
  product: ProductDocument,
  budgetRupees: number
): CalculationResult {
  if (budgetRupees <= 0 || product.price <= 0) {
    return {
      product,
      calculationType: 'quantity_for_money',
      budgetAmount: budgetRupees,
      calculatedQuantityBase: 0,
      displayQuantity: '0',
      breakdown: 'Budget must be greater than 0',
    };
  }

  const baseQuantity = budgetRupees / product.price;
  let displayQuantity = '';
  let breakdown = `Base price: ₹${product.price} per 1 ${product.unit}. For budget ₹${budgetRupees}: `;

  if (product.unit === 'kg') {
    const grams = baseQuantity * 1000;
    if (grams < 1000) {
      displayQuantity = `${Math.round(grams * 10) / 10} grams (${baseQuantity.toFixed(3)} kg)`;
      breakdown += `(₹${budgetRupees} ÷ ₹${product.price}) × 1000g = ${grams.toFixed(1)} grams`;
    } else {
      displayQuantity = `${baseQuantity.toFixed(2)} kg (${Math.round(grams)} grams)`;
      breakdown += `₹${budgetRupees} ÷ ₹${product.price} = ${baseQuantity.toFixed(3)} kg`;
    }
  } else if (product.unit === 'liter') {
    const ml = baseQuantity * 1000;
    if (ml < 1000) {
      displayQuantity = `${Math.round(ml * 10) / 10} ml (${baseQuantity.toFixed(3)} L)`;
      breakdown += `(₹${budgetRupees} ÷ ₹${product.price}) × 1000ml = ${ml.toFixed(1)} ml`;
    } else {
      displayQuantity = `${baseQuantity.toFixed(2)} Liters (${Math.round(ml)} ml)`;
      breakdown += `₹${budgetRupees} ÷ ₹${product.price} = ${baseQuantity.toFixed(3)} Liters`;
    }
  } else if (product.unit === 'dozen') {
    const totalItems = baseQuantity * 12;
    const wholeItems = Math.floor(totalItems);
    const costPerItem = product.price / 12;
    const remainderRupees = budgetRupees - wholeItems * costPerItem;

    if (wholeItems > 0 && remainderRupees > 0.05) {
      displayQuantity = `${wholeItems} pieces (with ₹${remainderRupees.toFixed(2)} balance), or ~${totalItems.toFixed(2)} pieces (${baseQuantity.toFixed(2)} dozen)`;
    } else {
      displayQuantity = `${totalItems.toFixed(1)} pieces (${baseQuantity.toFixed(2)} dozen)`;
    }
    breakdown += `₹${product.price}/dozen is ₹${costPerItem.toFixed(2)} per item. ₹${budgetRupees} gets ~${totalItems.toFixed(2)} items`;
  } else {
    // piece or packet
    const units = baseQuantity;
    displayQuantity = `${units.toFixed(2)} ${product.unit}s`;
    breakdown += `₹${budgetRupees} ÷ ₹${product.price} = ${units.toFixed(2)} ${product.unit}`;
  }

  return {
    product,
    calculationType: 'quantity_for_money',
    budgetAmount: budgetRupees,
    calculatedQuantityBase: Number(baseQuantity.toFixed(4)),
    displayQuantity,
    breakdown,
  };
}

/**
 * Natural language intent parser for grocery price and quantity conversion
 */
export function parseGroceryQuery(
  query: string,
  products: ProductDocument[]
): CalculationResult | { generalAnswer?: string; matchedProduct?: ProductDocument } | null {
  const q = query.toLowerCase().trim();

  // Find best matching product
  let bestMatch: ProductDocument | null = null;
  let highestScore = 0;

  for (const product of products) {
    const pName = product.name.toLowerCase();
    const cleanPName = pName.replace(/[^a-z0-9]/g, ' ');

    let score = 0;
    // Direct inclusion
    if (q.includes(pName)) score += 10;
    // Key words
    const words = cleanPName.split(/\s+/).filter((w) => w.length > 2);
    for (const word of words) {
      if (q.includes(word)) score += 3;
    }
    // Specific match aliases
    if (pName.includes('sugar') && q.includes('sugar')) score += 15;
    if (pName.includes('oil') && (q.includes('oil') || q.includes('sunflower') || q.includes('coconut'))) score += 12;
    if (pName.includes('milk') && q.includes('milk')) score += 15;
    if (pName.includes('rice') && q.includes('rice')) score += 15;
    if (pName.includes('egg') && (q.includes('egg') || q.includes('eggs'))) score += 15;
    if (pName.includes('atta') && (q.includes('atta') || q.includes('wheat') || q.includes('flour'))) score += 15;
    if (pName.includes('dal') && (q.includes('dal') || q.includes('toor') || q.includes('moong'))) score += 15;
    if (pName.includes('ghee') && q.includes('ghee')) score += 15;
    if (pName.includes('almond') && (q.includes('almond') || q.includes('badam'))) score += 15;
    if (pName.includes('cashew') && (q.includes('cashew') || q.includes('kaju'))) score += 15;
    if (pName.includes('salt') && q.includes('salt')) score += 15;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = product;
    }
  }

  if (!bestMatch || highestScore < 3) {
    return null;
  }

  // Check Pattern 1: Budget / Reverse quantity ("how much for 10 rupees", "quantity for 10 rs", "for 50 rs how much")
  // Regex matches: "(for)? (\d+(\.\d+)?) (rupees|rs|inr|₹)" or "(\d+) (rupees|rs) of"
  const moneyRegex = /(?:(?:for|worth|in)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupees|rs\.?|inr|bucks)?\s*(?:of|for|worth)?)/i;
  const reverseKeywords = /(?:how much|how many|quantity|kitna|can i get|give me for|for \d+)/i;

  if (reverseKeywords.test(q)) {
    const moneyMatch = q.match(/(?:for|worth|in|give)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupees|rs\.?|inr)/i) ||
                       q.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i) ||
                       q.match(/(\d+(?:\.\d+)?)\s*(?:rupees|rs)/i);

    if (moneyMatch && moneyMatch[1]) {
      const budget = parseFloat(moneyMatch[1]);
      if (!isNaN(budget) && budget > 0) {
        return calculateQuantityForBudget(bestMatch, budget);
      }
    }
  }

  // Check Pattern 2: Specific quantity ("price of 500 grams of sugar", "250g sugar price", "1.5 kg rice", "half kg", "quarter kg")
  // Check half / quarter words
  if (/\b(?:half|1\/2)\s*(?:kg|kilo|liter|litre|dozen)?\b/i.test(q)) {
    const qty = 0.5;
    const unit = bestMatch.unit;
    return calculatePriceForQuantity(bestMatch, qty, unit);
  }
  if (/\b(?:quarter|1\/4|pao)\s*(?:kg|kilo|liter|litre)?\b/i.test(q)) {
    const qty = 0.25;
    const unit = bestMatch.unit;
    return calculatePriceForQuantity(bestMatch, qty, unit);
  }

  // Regex for quantity with unit: "500 grams", "500g", "2.5kg", "250ml", "2 liters", "6 eggs", "3 packets"
  const qtyUnitRegex = /(\d+(?:\.\d+)?)\s*(grams?|gms?|gm|g|kg|kilos?|kilograms?|milliliters?|millilitres?|ml|liters?|litres?|l|dozens?|pieces?|eggs?|packets?|pkts?|units?)/i;
  const match = q.match(qtyUnitRegex);

  if (match) {
    const qty = parseFloat(match[1]);
    const unit = match[2];
    if (!isNaN(qty) && qty > 0) {
      return calculatePriceForQuantity(bestMatch, qty, unit);
    }
  }

  // If user simply asks "price of sugar" or "how much is sugar" -> 1 base unit
  const basePriceCheck = /(?:price|cost|rate|kitna|bhav)/i;
  if (basePriceCheck.test(q)) {
    return calculatePriceForQuantity(bestMatch, 1, bestMatch.unit);
  }

  return { matchedProduct: bestMatch };
}
