import React, { useState } from 'react';
import { Product } from '../types/grocery.ts';
import { Edit3, Trash2, Check, Calculator, Sparkles, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isEditMode: boolean;
  isDeleteMode: boolean;
  isSelectedForDelete: boolean;
  onToggleSelectDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onAskChatbot: (product: Product, prompt: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isEditMode,
  isDeleteMode,
  isSelectedForDelete,
  onToggleSelectDelete,
  onEdit,
  onDelete,
  onAskChatbot,
}) => {
  // Preset quantity options based on unit schema
  const getUnitPresets = () => {
    switch (product.unit) {
      case 'kg':
        return [
          { label: '250g', multiplier: 0.25, prompt: `Price of 250 grams of ${product.name}?` },
          { label: '500g', multiplier: 0.5, prompt: `Price of 500 grams of ${product.name}?` },
          { label: '1 kg', multiplier: 1, prompt: `Price of 1 kg of ${product.name}?` },
          { label: '2 kg', multiplier: 2, prompt: `Price of 2 kg of ${product.name}?` },
        ];
      case 'liter':
        return [
          { label: '250ml', multiplier: 0.25, prompt: `Price of 250 ml of ${product.name}?` },
          { label: '500ml', multiplier: 0.5, prompt: `Price of 500 ml of ${product.name}?` },
          { label: '1 L', multiplier: 1, prompt: `Price of 1 liter of ${product.name}?` },
          { label: '2 L', multiplier: 2, prompt: `Price of 2 liters of ${product.name}?` },
        ];
      case 'dozen':
        return [
          { label: '1 pc', multiplier: 1 / 12, prompt: `Price of 1 piece of ${product.name}?` },
          { label: '6 pcs (½ dz)', multiplier: 0.5, prompt: `Price of 6 pieces of ${product.name}?` },
          { label: '1 dozen', multiplier: 1, prompt: `Price of 1 dozen of ${product.name}?` },
        ];
      case 'piece':
      case 'packet':
      default:
        return [
          { label: `1 ${product.unit}`, multiplier: 1, prompt: `Price of 1 ${product.unit} of ${product.name}?` },
          { label: `2 ${product.unit}s`, multiplier: 2, prompt: `Price of 2 ${product.unit}s of ${product.name}?` },
          { label: `5 ${product.unit}s`, multiplier: 5, prompt: `Price of 5 ${product.unit}s of ${product.name}?` },
        ];
    }
  };

  const presets = getUnitPresets();
  const [activePresetIndex, setActivePresetIndex] = useState<number>(
    presets.findIndex((p) => p.multiplier === 1) !== -1
      ? presets.findIndex((p) => p.multiplier === 1)
      : 0
  );

  const currentPreset = presets[activePresetIndex] || presets[0];
  const calculatedPresetPrice = (product.price * currentPreset.multiplier).toFixed(2);

  // Compute sample for ₹10
  const qtyForTenRupees = (() => {
    if (product.unit === 'kg') {
      const grams = (10 / product.price) * 1000;
      return `${grams.toFixed(0)}g for ₹10`;
    }
    if (product.unit === 'liter') {
      const ml = (10 / product.price) * 1000;
      return `${ml.toFixed(0)}ml for ₹10`;
    }
    if (product.unit === 'dozen') {
      const pcs = (10 / product.price) * 12;
      return `${pcs.toFixed(1)} pcs for ₹10`;
    }
    const units = 10 / product.price;
    return `${units.toFixed(2)} ${product.unit} for ₹10`;
  })();

  const isLowStock = product.stock <= 10;

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
        isSelectedForDelete
          ? 'border-rose-400 ring-2 ring-rose-200'
          : isEditMode
          ? 'border-amber-300'
          : 'border-stone-200/80 hover:border-stone-300'
      }`}
    >
      {/* Delete selection checkbox in delete mode */}
      {isDeleteMode && (
        <button
          onClick={() => onToggleSelectDelete(product._id)}
          className="absolute top-3 left-3 z-20 w-7 h-7 rounded-lg bg-white/95 border border-stone-300 shadow-md flex items-center justify-center cursor-pointer hover:bg-stone-50"
        >
          {isSelectedForDelete ? (
            <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center text-white">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded border-2 border-stone-400" />
          )}
        </button>
      )}

      {/* Floating management actions in edit mode */}
      {isEditMode && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 p-1 rounded-xl shadow-md border border-stone-200">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            title="Edit item"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product._id, product.name)}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Image Section */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // fallback image if broken url
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-60" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          {!isDeleteMode && (
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-stone-800 shadow-xs">
              {product.category}
            </span>
          )}
        </div>

        {/* Stock status badge */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium backdrop-blur-md ${
              isLowStock
                ? 'bg-amber-900/80 text-amber-200'
                : 'bg-stone-900/75 text-emerald-300'
            }`}
          >
            {isLowStock && <AlertCircle className="w-3 h-3 text-amber-400" />}
            {product.stock} {product.unit} in stock
          </span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-stone-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description || 'Fresh quality grocery item stored in store inventory.'}
          </p>

          {/* Base Unit Price Banner from Database Schema */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                Database Base Rate
              </span>
              <span className="text-xs font-mono text-stone-400">1 {product.unit}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-stone-900 font-['Outfit']">
                ₹{product.price}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                / {product.unit}
              </span>
            </div>
          </div>

          {/* Dynamic Unit Converter Presets */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mb-1.5">
              <span>Dynamic Quantity Price:</span>
              <span className="text-emerald-700 font-bold font-mono">
                {currentPreset.label} = ₹{calculatedPresetPrice}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {presets.map((preset, index) => {
                const isActive = activePresetIndex === index;
                return (
                  <button
                    key={preset.label}
                    onClick={() => setActivePresetIndex(index)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions & Quick AI query */}
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
          {/* Quick budget chip (e.g. ₹10 conversion preview) */}
          <div className="flex items-center justify-between text-[11px] text-stone-600 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200/40">
            <span className="text-amber-900 font-medium">₹10 Budget value:</span>
            <span className="font-semibold text-stone-800">{qtyForTenRupees}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Ask Chatbot button */}
            <button
              onClick={() =>
                onAskChatbot(
                  product,
                  `What is the price of ${currentPreset.label} of ${product.name}?`
                )
              }
              className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-medium bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-stone-700 border border-stone-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask AI Price</span>
            </button>

            {/* In regular mode: Quick direct edit/delete hover buttons */}
            {!isEditMode && !isDeleteMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800 cursor-pointer"
                  title="Edit product"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(product._id, product.name)}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-rose-50 text-stone-500 hover:text-rose-600 cursor-pointer"
                  title="Delete product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
