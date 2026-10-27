import React, { useState, useEffect } from 'react';
import { Product, CalculationResult } from '../types/grocery.ts';
import { calculateUnitMath } from '../services/api.ts';
import { Calculator, X, ArrowRight, Check, Sparkles, Scale, IndianRupee } from 'lucide-react';

interface UnitCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
}

export const UnitCalculatorModal: React.FC<UnitCalculatorModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [calcType, setCalcType] = useState<'price_for_quantity' | 'quantity_for_money'>(
    'price_for_quantity'
  );
  const [quantity, setQuantity] = useState<string>('500');
  const [inputUnit, setInputUnit] = useState<string>('g');
  const [budget, setBudget] = useState<string>('10');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct._id);
      if (initialProduct.unit === 'kg') {
        setInputUnit('g');
        setQuantity('500');
      } else if (initialProduct.unit === 'liter') {
        setInputUnit('ml');
        setQuantity('250');
      } else if (initialProduct.unit === 'dozen') {
        setInputUnit('piece');
        setQuantity('6');
      } else {
        setInputUnit(initialProduct.unit);
        setQuantity('1');
      }
    } else if (products.length > 0 && !selectedProductId) {
      const sugar = products.find((p) => p.name.toLowerCase().includes('sugar')) || products[0];
      setSelectedProductId(sugar._id);
      setInputUnit('g');
      setQuantity('500');
    }
  }, [initialProduct, products, isOpen]);

  const activeProduct = products.find((p) => p._id === selectedProductId) || products[0];

  const handleCompute = async () => {
    if (!activeProduct) return;
    setIsLoading(true);
    setError(null);
    try {
      if (calcType === 'price_for_quantity') {
        const q = parseFloat(quantity);
        if (isNaN(q) || q <= 0) throw new Error('Enter a valid quantity');
        const res = await calculateUnitMath({
          productId: activeProduct._id,
          calculationType: 'price_for_quantity',
          quantity: q,
          unit: inputUnit,
        });
        setResult(res);
      } else {
        const b = parseFloat(budget);
        if (isNaN(b) || b <= 0) throw new Error('Enter a valid budget amount');
        const res = await calculateUnitMath({
          productId: activeProduct._id,
          calculationType: 'quantity_for_money',
          budget: b,
        });
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message || 'Calculation error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeProduct && isOpen) {
      handleCompute();
    }
  }, [selectedProductId, calcType, quantity, inputUnit, budget]);

  if (!isOpen) return null;

  const getCompatibleUnits = () => {
    if (!activeProduct) return [];
    if (activeProduct.unit === 'kg') {
      return [
        { value: 'g', label: 'Grams (g)' },
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'mg', label: 'Milligrams (mg)' },
        { value: 'pao', label: 'Pao (~250g)' },
      ];
    }
    if (activeProduct.unit === 'liter') {
      return [
        { value: 'ml', label: 'Milliliters (ml)' },
        { value: 'liter', label: 'Liters (L)' },
      ];
    }
    if (activeProduct.unit === 'dozen') {
      return [
        { value: 'piece', label: 'Pieces (individual eggs/units)' },
        { value: 'dozen', label: 'Dozen (12 pcs)' },
      ];
    }
    return [{ value: activeProduct.unit, label: activeProduct.unit }];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-['Outfit']">
                Smart Grocery Unit Converter
              </h2>
              <p className="text-xs text-stone-500">
                Accurate unit & budget conversions from base rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Select Item */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.price} / 1 {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setCalcType('price_for_quantity')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                calcType === 'price_for_quantity'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Price for Quantity</span>
            </button>
            <button
              onClick={() => setCalcType('quantity_for_money')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                calcType === 'quantity_for_money'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>Quantity for ₹ Budget</span>
            </button>
          </div>

          {/* Inputs */}
          {calcType === 'price_for_quantity' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Requested Quantity
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unit
                </label>
                <select
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                >
                  {getCompatibleUnits().map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Budget in Rupees (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Calculation Result Card */}
          {result && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                <span>Calculated Result</span>
                <span className="font-mono text-[11px] text-emerald-700">
                  Base: ₹{result.product.price} / {result.product.unit}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-950 font-['Outfit']">
                  {result.calculationType === 'price_for_quantity'
                    ? result.priceFormatted
                    : result.displayQuantity}
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-900/80 font-mono bg-white/70 p-2 rounded-lg border border-emerald-100">
                {result.breakdown}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
