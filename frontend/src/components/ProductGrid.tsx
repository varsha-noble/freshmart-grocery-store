import React from 'react';
import { Product } from '../types/grocery.ts';
import { ProductCard } from './ProductCard.tsx';
import { PackageOpen, Plus, Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isEditMode: boolean;
  isDeleteMode: boolean;
  selectedDeleteIds: string[];
  onToggleSelectDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onAskChatbot: (product: Product, prompt: string) => void;
  onOpenAddModal: () => void;
  onResetSeed: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  isEditMode,
  isDeleteMode,
  selectedDeleteIds,
  onToggleSelectDelete,
  onEdit,
  onDelete,
  onAskChatbot,
  onOpenAddModal,
  onResetSeed,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse flex flex-col"
          >
            <div className="aspect-[4/3] bg-stone-200" />
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
              <div className="h-12 bg-stone-100 rounded-xl" />
              <div className="h-8 bg-stone-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-stone-300 max-w-xl mx-auto my-8 p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-stone-800">No Grocery Items Found</h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          No products matched your search or category filter in the MongoDB inventory collection.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
          <button
            onClick={onResetSeed}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Restore Default Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-4">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          isEditMode={isEditMode}
          isDeleteMode={isDeleteMode}
          isSelectedForDelete={selectedDeleteIds.includes(product._id)}
          onToggleSelectDelete={onToggleSelectDelete}
          onEdit={onEdit}
          onDelete={onDelete}
          onAskChatbot={onAskChatbot}
        />
      ))}
    </div>
  );
};
