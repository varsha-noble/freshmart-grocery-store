import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.ts';
import {
  calculatePriceForQuantity,
  calculateQuantityForBudget,
} from './unitConverter.ts';
import { handleGroceryChat } from './chatService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize database connection
db.connect().catch((err) => {
  console.error('Database initialization error:', err);
});

// Database status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: db.getStatus(),
  });
});

// List all products with optional filters
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const products = await db.getAll({ category, search });
    res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unique categories
app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, unit, stock, description, image, isPopular } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Product name is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive price is required' });
    }
    if (!['kg', 'liter', 'piece', 'packet', 'dozen'].includes(unit)) {
      return res.status(400).json({
        success: false,
        error: "Unit must be one of 'kg', 'liter', 'piece', 'packet', 'dozen'",
      });
    }

    const newProduct = await db.create({
      name,
      category,
      price: Number(price),
      currency: '₹',
      unit,
      stock: Number(stock) || 0,
      description: description || '',
      image: image || '',
      isPopular: !!isPopular,
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, category, price, unit, stock, description, image, isPopular } = req.body;

    const existing = await db.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (category !== undefined) updates.category = category.trim();
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) <= 0) {
        return res.status(400).json({ success: false, error: 'Valid positive price is required' });
      }
      updates.price = Number(price);
    }
    if (unit !== undefined) {
      if (!['kg', 'liter', 'piece', 'packet', 'dozen'].includes(unit)) {
        return res.status(400).json({
          success: false,
          error: "Unit must be one of 'kg', 'liter', 'piece', 'packet', 'dozen'",
        });
      }
      updates.unit = unit;
    }
    if (stock !== undefined) updates.stock = Math.max(0, Number(stock));
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (isPopular !== undefined) updates.isPopular = !!isPopular;

    const updated = await db.update(req.params.id, updates);
    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const success = await db.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch delete products
app.post('/api/products/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of ids required' });
    }
    const count = await db.deleteMany(ids);
    res.json({ success: true, deletedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset catalog to default seed
app.post('/api/products/reset-seed', async (req, res) => {
  try {
    const products = await db.resetDefaults();
    res.json({ success: true, message: 'Reset default catalog successfully', products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculation endpoint (direct unit conversion math)
app.post('/api/calculate', async (req, res) => {
  try {
    const { productId, calculationType, quantity, unit, budget } = req.body;
    const product = await db.getById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (calculationType === 'price_for_quantity') {
      const q = parseFloat(quantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid quantity' });
      }
      const result = calculatePriceForQuantity(product, q, unit || product.unit);
      return res.json({ success: true, result });
    } else if (calculationType === 'quantity_for_money') {
      const b = parseFloat(budget);
      if (isNaN(b) || b <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid budget amount' });
      }
      const result = calculateQuantityForBudget(product, b);
      return res.json({ success: true, result });
    } else {
      return res.status(400).json({
        success: false,
        error: "calculationType must be 'price_for_quantity' or 'quantity_for_money'",
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chatbot endpoint with inventory connection & unit conversion
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message string required' });
    }
    const response = await handleGroceryChat(message);
    res.json({ success: true, ...response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware or static serving
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FreshMart Grocery Store server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
