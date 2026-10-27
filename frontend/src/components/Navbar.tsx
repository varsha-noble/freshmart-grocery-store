import React from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Calculator,
  Search,
  Database,
  Store,
  RotateCcw,
  CheckSquare,
  XSquare,
} from 'lucide-react';
import { DatabaseStatus } from '../types/grocery.ts';

interface NavbarProps {
  dbStatus: DatabaseStatus | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isDeleteMode: boolean;
  onToggleDeleteMode: () => void;
  selectedCount: number;
  onBatchDelete: () => void;
  onOpenCalculator: () => void;
  onResetSeed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbStatus,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  isEditMode,
  onToggleEditMode,
  isDeleteMode,
  onToggleDeleteMode,
  selectedCount,
  onBatchDelete,
  onOpenCalculator,
  onResetSeed,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top utility alert bar */}
      <div className="bg-stone-900 text-stone-300 text-xs py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-stone-300 text-xs">
            Fresh Groceries • Fast Delivery
          </span>
        </div>
        <div className="flex items-center gap-3 text-stone-400 text-xs">
          <span className="hidden md:inline">Currency: ₹ (INR)</span>
          <button
            onClick={onResetSeed}
            title="Restore sample grocery catalog"
            className="hover:text-stone-100 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Sample Catalog</span>
          </button>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 font-['Outfit']">
                  FreshMart
                </h1>
              </div>
            </div>

            {/* Mobile Calculator Quick Button */}
            <button
              onClick={onOpenCalculator}
              className="lg:hidden p-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
              title="Unit Converter"
            >
              <Calculator className="w-5 h-5 text-emerald-700" />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sugar, milk, oil, rice, pulses..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-100 hover:bg-stone-100/80 focus:bg-white text-stone-900 text-sm rounded-xl border border-transparent focus:border-emerald-600 focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Navbar Actions: Add, Edit, Delete Buttons as requested */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Unit Calculator Button */}
            <button
              onClick={onOpenCalculator}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unit Calculator</span>
            </button>

            {/* + Add Item Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

            {/* Edit Items Toggle Button */}
            <button
              onClick={onToggleEditMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer active:scale-95 ${
                isEditMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Items'}</span>
            </button>

            {/* Delete Items Toggle Button */}
            <button
              onClick={onToggleDeleteMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer active:scale-95 ${
                isDeleteMode
                  ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isDeleteMode ? 'Exit Delete Mode' : 'Delete Items'}</span>
            </button>
          </div>

        </div>

        {/* Delete Mode Banner if active */}
        {isDeleteMode && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Delete Mode Active:</span>
              <span>Select item cards with checkboxes to delete or click the trash icon on any card.</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <button
                  onClick={onBatchDelete}
                  className="px-3 py-1 bg-rose-700 text-white font-semibold rounded-lg hover:bg-rose-800 transition-colors cursor-pointer"
                >
                  Delete Selected ({selectedCount})
                </button>
              )}
              <button
                onClick={onToggleDeleteMode}
                className="text-stone-500 hover:text-stone-800 underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode Banner if active */}
        {isEditMode && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Edit Mode Active:</span>
              <span>Click the "Edit" button on any product card to update its base price, unit (kg, liter, dozen), stock, or details.</span>
            </div>
            <button
              onClick={onToggleEditMode}
              className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Done Editing
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
