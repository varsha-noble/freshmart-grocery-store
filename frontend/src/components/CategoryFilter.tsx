import React from 'react';
import { Layers, Sparkles, Wheat, Milk, Droplet, Nut, Flame, Coffee } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('grain') || cat.includes('staple')) return Wheat;
  if (cat.includes('oil') || cat.includes('ghee')) return Droplet;
  if (cat.includes('dairy') || cat.includes('milk') || cat.includes('egg')) return Milk;
  if (cat.includes('pulse') || cat.includes('lentil')) return Layers;
  if (cat.includes('spice')) return Flame;
  if (cat.includes('dry fruit') || cat.includes('nut')) return Nut;
  if (cat.includes('beverage') || cat.includes('tea')) return Coffee;
  return Sparkles;
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  const allCategories = ['All', ...categories];

  return (
    <div className="py-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-2 pb-1">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = cat === 'All' ? totalCount : categoryCounts[cat] || 0;
          const Icon = cat === 'All' ? Sparkles : getCategoryIcon(cat);

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-xs scale-102'
                  : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-stone-400'}`} />
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-stone-800 text-emerald-300'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
