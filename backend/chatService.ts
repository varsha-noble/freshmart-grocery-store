import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import {
  parseGroceryQuery,
  calculatePriceForQuantity,
  calculateQuantityForBudget,
  CalculationResult,
} from './unitConverter.ts';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface ChatReply {
  reply: string;
  calculation?: CalculationResult | null;
  suggestedQuestions?: string[];
  matchedProduct?: any;
}

export async function handleGroceryChat(userMessage: string): Promise<ChatReply> {
  const products = await db.getAll();
  const queryCalc = parseGroceryQuery(userMessage, products);

  // If a calculation was identified
  let calculationData: CalculationResult | null = null;
  let matchedProduct: any = null;

  if (queryCalc && 'calculationType' in queryCalc) {
    calculationData = queryCalc as CalculationResult;
    matchedProduct = calculationData.product;
  } else if (queryCalc && 'matchedProduct' in queryCalc && queryCalc.matchedProduct) {
    matchedProduct = queryCalc.matchedProduct;
  }

  // Pre-generate deterministic answer
  let deterministicText = '';
  if (calculationData) {
    if (calculationData.calculationType === 'price_for_quantity') {
      deterministicText = `The price for **${calculationData.requestedQuantity} ${calculationData.requestedUnit}** of **${calculationData.product.name}** is **${calculationData.priceFormatted}**.\n\n` +
        `• **Base Rate:** ₹${calculationData.product.price} per 1 ${calculationData.product.unit}\n` +
        `• **Calculation:** ${calculationData.breakdown}\n` +
        `• **Current Stock:** ${calculationData.product.stock} ${calculationData.product.unit} available in store.`;
    } else {
      deterministicText = `For **₹${calculationData.budgetAmount}**, you will get **${calculationData.displayQuantity}** of **${calculationData.product.name}**.\n\n` +
        `• **Base Rate:** ₹${calculationData.product.price} per 1 ${calculationData.product.unit}\n` +
        `• **Formula:** ${calculationData.breakdown}\n` +
        `• **Current Stock:** ${calculationData.product.stock} ${calculationData.product.unit} available in store.`;
    }
  } else if (matchedProduct) {
    deterministicText = `**${matchedProduct.name}** (${matchedProduct.category}):\n` +
      `• **Base Price:** ₹${matchedProduct.price} per 1 ${matchedProduct.unit}\n` +
      `• **Stock:** ${matchedProduct.stock} ${matchedProduct.unit}\n` +
      `• **Description:** ${matchedProduct.description}\n\n` +
      `You can ask me things like *"Price of 500g ${matchedProduct.name}"* or *"How much for ₹10?"*`;
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const inventorySummary = products
        .map(
          (p) =>
            `- ${p.name} [ID: ${p._id}]: ₹${p.price} per 1 ${p.unit} (Category: ${p.category}, Stock: ${p.stock} ${p.unit})`
        )
        .join('\n');

      const systemInstruction = `You are FreshMart's Smart Grocery Store Pricing & Inventory AI Assistant.
You have direct real-time access to our NoSQL MongoDB inventory database:

CURRENT STORE INVENTORY:
${inventorySummary}

RULES FOR ANSWERING:
1. Base unit prices are strictly stored as 1 base unit (e.g. 1 kg, 1 liter, 1 dozen, 1 packet).
2. ACCURATE UNIT CONVERSIONS ARE MANDATORY:
   - For Weight (kg): 1 kg = 1000 grams. If asked for 500g of Sugar (₹65/kg), the exact price is ₹32.50 (500/1000 * 65).
   - If asked for money-to-quantity (e.g. "how much quantity for 10 rupees of sugar"):
     10 / 65 = 0.1538 kg = 153.8 grams! Show both grams and kg clearly.
   - For Volume (liter): 1 liter = 1000 ml. 250ml of oil (₹140/L) = ₹35.
   - For Count (dozen): 1 dozen = 12 items. 6 eggs (₹84/dozen) = ₹42. For ₹10 = ~1.43 eggs.
3. If pre-computed calculation data is provided below, treat it as the verified mathematical truth:
${
  calculationData
    ? `VERIFIED MATH CALCULATION:
   Product: ${calculationData.product.name}
   Type: ${calculationData.calculationType}
   Breakdown: ${calculationData.breakdown}
   ${
     calculationData.calculationType === 'price_for_quantity'
       ? `Price: ${calculationData.priceFormatted}`
       : `Quantity: ${calculationData.displayQuantity}`
   }`
    : 'No pre-calculated formula; calculate accurately using the rules above.'
}
4. Tone: Courteous, concise, helpful, and transparent. Mention the base unit price and the converted amount.
5. Do not hallucinate items that don't exist in our inventory; if an item is not found, list similar items in our inventory.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          temperature: 0.2, // low temperature for high arithmetic fidelity
        },
      });

      const replyText = response.text || deterministicText || "I'm here to help with grocery prices, conversions, and stock information.";

      return {
        reply: replyText,
        calculation: calculationData,
        matchedProduct,
        suggestedQuestions: [
          'Price of 500g sugar?',
          'How much sugar for 10 rupees?',
          'Price of 250ml sunflower oil?',
          'How much milk for 20 rupees?',
          'How many eggs for 30 rupees?',
        ],
      };
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic calculation engine:', err);
    }
  }

  // Fallback if no Gemini key or fallback needed
  if (!deterministicText) {
    // Check if user is asking for general stock or items
    const lower = userMessage.toLowerCase();
    if (lower.includes('all') || lower.includes('list') || lower.includes('items') || lower.includes('stock')) {
      const topItems = products.slice(0, 6).map(p => `• **${p.name}**: ₹${p.price} / ${p.unit} (Stock: ${p.stock} ${p.unit})`).join('\n');
      deterministicText = `Here are some popular grocery items currently in stock:\n\n${topItems}\n\nAsk me for custom quantities like *"Price of 250g sugar"* or *"How much oil for ₹50?"*.`;
    } else {
      deterministicText = `Hello! I'm your FreshMart assistant. You can ask me pricing questions for any quantity or budget, such as:\n` +
        `• *"What is the price of 500 grams of sugar?"*\n` +
        `• *"How much quantity can I get for 10 rupees of sugar?"*\n` +
        `• *"Price of 250ml sunflower oil?"*\n` +
        `• *"Price of 6 eggs?"*`;
    }
  }

  return {
    reply: deterministicText,
    calculation: calculationData,
    matchedProduct,
    suggestedQuestions: [
      'Price of 500g sugar?',
      'How much sugar for 10 rupees?',
      'Price of 250ml sunflower oil?',
      'How much milk for 20 rupees?',
      'How many eggs for 30 rupees?',
    ],
  };
}
