import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchProducts,
  fetchCategories,
  fetchDatabaseStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  batchDeleteProducts,
  resetCatalog,
} from './services/api.ts';
import { Product, DatabaseStatus } from './types/grocery.ts';
import { Navbar } from './components/Navbar.tsx';
import { CategoryFilter } from './components/CategoryFilter.tsx';
import { ProductGrid } from './components/ProductGrid.tsx';
import { ProductModal } from './components/ProductModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { UnitCalculatorModal } from './components/UnitCalculatorModal.tsx';
import { Chatbot } from './components/Chatbot.tsx';
import {
  Store,
  Layers,
  Scale,
  Database,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Management Mode States
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  // Chatbot Trigger
  const [chatbotPrompt, setChatbotPrompt] = useState<{ product: Product; prompt: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedProducts, fetchedCategories, status] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchDatabaseStatus().catch(() => null),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      if (status) setDbStatus(status);
    } catch (err: any) {
      showToast(err.message || 'Error loading store data from MongoDB', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'All' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Product Save (Add or Update)
  const handleSaveProduct = async (productData: any) => {
    if (productToEdit) {
      const updated = await updateProduct(productToEdit._id, productData);
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      showToast(`Updated "${updated.name}" in MongoDB database`);
    } else {
      const created = await createProduct(productData);
      setProducts((prev) => [created, ...prev]);
      // Update categories if new
      if (!categories.includes(created.category)) {
        setCategories((prev) => [...prev, created.category].sort());
      }
      showToast(`Added "${created.name}" to MongoDB database`);
    }
    // Refresh db status
    fetchDatabaseStatus().then(setDbStatus).catch(() => {});
  };

  // Toggle selection for batch delete
  const handleToggleSelectDelete = (id: string) => {
    setSelectedDeleteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single Item Delete Confirmation
  const handleDeleteSingle = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setIsDeleteConfirmOpen(true);
  };

  // Execute single or batch delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (itemToDelete) {
        await deleteProduct(itemToDelete.id);
        setProducts((prev) => prev.filter((p) => p._id !== itemToDelete.id));
        showToast(`Deleted "${itemToDelete.name}" from MongoDB`);
        setItemToDelete(null);
      } else if (selectedDeleteIds.length > 0) {
        const count = await batchDeleteProducts(selectedDeleteIds);
        setProducts((prev) => prev.filter((p) => !selectedDeleteIds.includes(p._id)));
        showToast(`Deleted ${count} items from MongoDB`);
        setSelectedDeleteIds([]);
        setIsDeleteMode(false);
      }
      setIsDeleteConfirmOpen(false);
      fetchDatabaseStatus().then(setDbStatus).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Failed to delete items', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to default seed
  const handleResetCatalog = async () => {
    if (!confirm('Restore the default grocery store catalog with seed items?')) return;
    try {
      setIsLoading(true);
      const defaults = await resetCatalog();
      setProducts(defaults);
      const cats = await fetchCategories();
      setCategories(cats);
      showToast('Restored default catalog into MongoDB');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Navigation Bar with Add, Edit, Delete Buttons */}
      <Navbar
        dbStatus={dbStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        isEditMode={isEditMode}
        onToggleEditMode={() => {
          setIsEditMode(!isEditMode);
          if (isDeleteMode) setIsDeleteMode(false);
        }}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={() => {
          setIsDeleteMode(!isDeleteMode);
          if (isEditMode) setIsEditMode(false);
          setSelectedDeleteIds([]);
        }}
        selectedCount={selectedDeleteIds.length}
        onBatchDelete={() => {
          if (selectedDeleteIds.length > 0) {
            setItemToDelete(null);
            setIsDeleteConfirmOpen(true);
          }
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onResetSeed={handleResetCatalog}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Subheader / Store Schema Info Bar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                  Store Inventory
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1 font-['Outfit']">
                Fresh Groceries & Dynamic Unit Rates
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 max-w-2xl leading-relaxed">
                Base prices are strictly recorded per 1 standard unit (1 kg, 1 liter, 1 dozen). 
                The UI & AI assistant dynamically convert custom weights (500g, 250ml) and reverse budget purchases (e.g. quantity for ₹10).
              </p>
            </div>

            {/* Quick Schema badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold">Weights:</span>
                <span className="font-mono text-stone-500">kg, g, mg</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold">Volumes:</span>
                <span className="font-mono text-stone-500">liter, ml</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 text-xs flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold">Counts:</span>
                <span className="font-mono text-stone-500">dozen, piece</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-4">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            totalCount={products.length}
          />
        </div>

        {/* Results Counter & Search Indicator */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-3 px-1">
          <span>
            Showing <strong className="text-stone-800">{filteredProducts.length}</strong> items
            {selectedCategory !== 'All' && <span> in <strong className="text-emerald-700">{selectedCategory}</strong></span>}
            {searchQuery && <span> matching "<strong className="text-stone-800">{searchQuery}</strong>"</span>}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-700 hover:underline cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          isLoading={isLoading}
          isEditMode={isEditMode}
          isDeleteMode={isDeleteMode}
          selectedDeleteIds={selectedDeleteIds}
          onToggleSelectDelete={handleToggleSelectDelete}
          onEdit={(product) => {
            setProductToEdit(product);
            setIsProductModalOpen(true);
          }}
          onDelete={handleDeleteSingle}
          onAskChatbot={(product, prompt) => {
            setChatbotPrompt({ product, prompt });
          }}
          onOpenAddModal={() => {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          }}
          onResetSeed={handleResetCatalog}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 font-['Outfit']">FreshMart</span>
            <span>• Online Grocery Store</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Currency: ₹ (INR)</span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        existingCategories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={
          itemToDelete
            ? `Delete "${itemToDelete.name}"?`
            : `Delete ${selectedDeleteIds.length} Selected Items?`
        }
        description={
          itemToDelete
            ? `This will remove "${itemToDelete.name}" permanently from the MongoDB inventory collection.`
            : `Are you sure you want to delete these ${selectedDeleteIds.length} items from the MongoDB inventory collection? This action cannot be undone.`
        }
        isDeleting={isDeleting}
      />

      {/* Standalone Unit Calculator Modal */}
      <UnitCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        products={products}
      />

      {/* Left-Side Corner Chatbot (as requested) */}
      <Chatbot
        externalPrompt={chatbotPrompt}
        onClearExternalPrompt={() => setChatbotPrompt(null)}
      />
    </div>
  );
}
