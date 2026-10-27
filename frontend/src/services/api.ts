import { Product, DatabaseStatus, CalculationResult } from '../types/grocery.ts';

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());

  const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
  const data = await res.json();
  return data.products || [];
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch('/api/products/categories');
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
  const data = await res.json();
  return data.categories || [];
}

export async function fetchDatabaseStatus(): Promise<DatabaseStatus> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error(`Failed to fetch database status`);
  const data = await res.json();
  return data.status;
}

export async function createProduct(
  productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create product');
  }
  return data.product;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, '_id' | 'createdAt'>>
): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update product');
  }
  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete product');
  }
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  const res = await fetch('/api/products/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to batch delete products');
  }
  return data.deletedCount;
}

export async function resetCatalog(): Promise<Product[]> {
  const res = await fetch('/api/products/reset-seed', {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reset catalog');
  }
  return data.products;
}

export async function calculateUnitMath(payload: {
  productId: string;
  calculationType: 'price_for_quantity' | 'quantity_for_money';
  quantity?: number;
  unit?: string;
  budget?: number;
}): Promise<CalculationResult> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to calculate');
  }
  return data.result;
}

export async function sendChatMessage(message: string): Promise<{
  reply: string;
  calculation?: CalculationResult | null;
  matchedProduct?: any;
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to get chat response');
  }
  return data;
}
