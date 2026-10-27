import React, { useState, useEffect } from 'react';
import { Product, UnitType } from '../types/grocery.ts';
import { X, Save, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  productToEdit?: Product | null;
  existingCategories: string[];
}

const DEFAULT_IMAGE_PRESETS = [
  { label: 'Sugar / Salt Crystals', url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cooking Oil & Liquids', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Rice & Grains', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fresh Milk & Dairy', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80' },
  { label: 'Flour & Atta', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Eggs & Poultry', url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lentils & Pulses', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Spices & Masala', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  existingCategories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<string>('');
  const [unit, setUnit] = useState<UnitType>('kg');
  const [stock, setStock] = useState<string>('50');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setCustomCategory('');
      setPrice(productToEdit.price.toString());
      setUnit(productToEdit.unit);
      setStock(productToEdit.stock.toString());
      setDescription(productToEdit.description || '');
      setImage(productToEdit.image || '');
    } else {
      setName('');
      setCategory(existingCategories[0] || 'Grains & Staples');
      setCustomCategory('');
      setPrice('');
      setUnit('kg');
      setStock('50');
      setDescription('');
      setImage(DEFAULT_IMAGE_PRESETS[0].url);
    }
    setError(null);
  }, [productToEdit, isOpen, existingCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();

    if (!name.trim()) {
      setError('Please provide a product name');
      return;
    }
    if (!finalCategory) {
      setError('Please provide or select a category');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid positive base unit price (e.g. ₹65 per 1 kg)');
      return;
    }
    const numStock = parseFloat(stock);
    if (isNaN(numStock) || numStock < 0) {
      setError('Please enter a valid stock quantity');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        category: finalCategory,
        price: numPrice,
        currency: '₹',
        unit,
        stock: numStock,
        description: description.trim(),
        image: image.trim() || DEFAULT_IMAGE_PRESETS[0].url,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-['Outfit']">
              {productToEdit ? 'Edit Grocery Item' : 'Add Item to MongoDB Inventory'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Prices are stored per 1 base unit (e.g. 1kg, 1 liter, 1 dozen).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Pure Cane Sugar, Sunflower Cooking Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
              >
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category</option>
              </select>
            </div>

            {category === '__custom__' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  New Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Snacks & Biscuits"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Base Unit */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Base Measurement Unit *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all font-mono"
              >
                <option value="kg">kg (Kilogram - for sugar, rice, flour, pulses)</option>
                <option value="liter">liter (Liter - for cooking oil, milk, ghee)</option>
                <option value="dozen">dozen (12 items - for eggs, bananas)</option>
                <option value="packet">packet (Per packet - for tea, coffee, salt)</option>
                <option value="piece">piece (Per item piece)</option>
              </select>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Price for 1 {unit} (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="e.g. 65"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                />
              </div>
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Stored in DB as ₹{price || '0'} / 1 {unit}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Stock Quantity ({unit}) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="e.g. 100"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Total available {unit}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Short Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Refined sparkling white crystal sugar for everyday cooking"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>

          {/* Image URL & Presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
              />
              {image && (
                <div className="w-9 h-9 rounded-xl border border-stone-200 overflow-hidden shrink-0 bg-stone-100">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Image Presets */}
            <div className="mt-2">
              <span className="text-[10px] text-stone-500 font-semibold block mb-1">
                Or pick a preset category image:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving to Database...' : productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
