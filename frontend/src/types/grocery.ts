export type UnitType = 'kg' | 'liter' | 'piece' | 'packet' | 'dozen';

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: UnitType;
  stock: number;
  description: string;
  image: string;
  isPopular?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationResult {
  product: Product;
  calculationType: 'price_for_quantity' | 'quantity_for_money';
  requestedQuantity?: number;
  requestedUnit?: string;
  calculatedPrice?: number;
  priceFormatted?: string;
  budgetAmount?: number;
  calculatedQuantityBase?: number;
  displayQuantity?: string;
  breakdown: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  calculation?: CalculationResult | null;
  matchedProduct?: Product;
}

export interface DatabaseStatus {
  engine: string;
  connected: boolean;
  totalItems: number;
  storageFile: string;
}
