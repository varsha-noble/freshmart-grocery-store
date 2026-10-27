import fs from 'fs';
import path from 'path';
import { MongoClient, Db, Collection } from 'mongodb';
import { ProductDocument, initialGroceryProducts } from './data/seedData.ts';

// Deterministic 24-character hex ID generation resembling MongoDB ObjectId
function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomChars = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + randomChars).toLowerCase();
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const JSON_DB_FILE = path.resolve(DATA_DIR, 'products.json');

class NoSQLGroceryDatabase {
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mongoCollection: Collection<ProductDocument> | null = null;
  private isConnectedToMongo: boolean = false;
  private localProducts: ProductDocument[] = [];

  constructor() {
    this.ensureLocalStoreDir();
    this.loadFromLocalFile();
  }

  private ensureLocalStoreDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromLocalFile() {
    try {
      if (fs.existsSync(JSON_DB_FILE)) {
        const raw = fs.readFileSync(JSON_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.localProducts = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read existing products.json, re-seeding default products:', e);
    }

    // Seed default items
    this.localProducts = initialGroceryProducts.map((item, idx) => ({
      ...item,
      _id: generateObjectId(),
      createdAt: new Date(Date.now() - (initialGroceryProducts.length - idx) * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    this.saveToLocalFile();
  }

  private saveToLocalFile() {
    try {
      this.ensureLocalStoreDir();
      fs.writeFileSync(JSON_DB_FILE, JSON.stringify(this.localProducts, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save to products.json:', e);
    }
  }

  public async connect(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        console.log('Connecting to MongoDB at:', mongoUri.replace(/:[^:@]+@/, ':****@'));
        this.mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 4000 });
        await this.mongoClient.connect();
        this.mongoDb = this.mongoClient.db('grocery_store_db');
        this.mongoCollection = this.mongoDb.collection<ProductDocument>('products');
        this.isConnectedToMongo = true;
        console.log('Successfully connected to MongoDB server!');

        // Check if collection is empty, if so, seed it
        const count = await this.mongoCollection.countDocuments();
        if (count === 0) {
          console.log('MongoDB collection empty. Seeding initial grocery products...');
          await this.mongoCollection.insertMany(this.localProducts as any);
        }
        return;
      } catch (err) {
        console.warn('MongoDB connection failed. Falling back to embedded NoSQL document database:', err);
        this.isConnectedToMongo = false;
      }
    } else {
      console.log('No MONGODB_URI set. Running on local persistent NoSQL document engine (JSON/BSON compatible).');
    }
  }

  public getStatus() {
    return {
      engine: this.isConnectedToMongo ? 'MongoDB Atlas / Standalone' : 'Embedded NoSQL Document Store (BSON/JSON)',
      connected: this.isConnectedToMongo,
      totalItems: this.localProducts.length,
      storageFile: JSON_DB_FILE,
    };
  }

  public async getAll(filter?: { category?: string; search?: string }): Promise<ProductDocument[]> {
    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        const query: any = {};
        if (filter?.category && filter.category !== 'All') {
          query.category = filter.category;
        }
        if (filter?.search && filter.search.trim()) {
          query.$or = [
            { name: { $regex: filter.search.trim(), $options: 'i' } },
            { description: { $regex: filter.search.trim(), $options: 'i' } },
            { category: { $regex: filter.search.trim(), $options: 'i' } },
          ];
        }
        const cursor = this.mongoCollection.find(query).sort({ updatedAt: -1 });
        return await cursor.toArray();
      } catch (e) {
        console.error('Mongo query failed, using local store:', e);
      }
    }

    // Local NoSQL query engine with MongoDB filter semantics
    let items = [...this.localProducts];

    if (filter?.category && filter.category !== 'All') {
      items = items.filter(
        (p) => p.category.toLowerCase() === filter.category!.toLowerCase()
      );
    }

    if (filter?.search && filter.search.trim()) {
      const term = filter.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    return items.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getById(id: string): Promise<ProductDocument | null> {
    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        const doc = await this.mongoCollection.findOne({ _id: id } as any);
        if (doc) return doc;
      } catch (e) {
        console.error('Mongo getById failed:', e);
      }
    }
    const found = this.localProducts.find((p) => p._id === id);
    return found || null;
  }

  public async create(
    data: Omit<ProductDocument, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProductDocument> {
    const now = new Date().toISOString();
    const newDoc: ProductDocument = {
      _id: generateObjectId(),
      name: data.name.trim(),
      category: data.category.trim(),
      price: Number(data.price),
      currency: data.currency || '₹',
      unit: data.unit,
      stock: Number(data.stock),
      description: (data.description || '').trim(),
      image:
        (data.image || '').trim() ||
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      isPopular: !!data.isPopular,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        await this.mongoCollection.insertOne(newDoc as any);
      } catch (e) {
        console.error('Mongo insert failed:', e);
      }
    }

    this.localProducts.unshift(newDoc);
    this.saveToLocalFile();
    return newDoc;
  }

  public async update(
    id: string,
    updates: Partial<Omit<ProductDocument, '_id' | 'createdAt'>>
  ): Promise<ProductDocument | null> {
    const index = this.localProducts.findIndex((p) => p._id === id);
    if (index === -1) {
      return null;
    }

    const current = this.localProducts[index];
    const updated: ProductDocument = {
      ...current,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : current.price,
      stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
      unit: updates.unit !== undefined ? updates.unit : current.unit,
      updatedAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        await this.mongoCollection.updateOne(
          { _id: id } as any,
          { $set: updated as any }
        );
      } catch (e) {
        console.error('Mongo update failed:', e);
      }
    }

    this.localProducts[index] = updated;
    this.saveToLocalFile();
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    const index = this.localProducts.findIndex((p) => p._id === id);
    if (index === -1) {
      return false;
    }

    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        await this.mongoCollection.deleteOne({ _id: id } as any);
      } catch (e) {
        console.error('Mongo delete failed:', e);
      }
    }

    this.localProducts.splice(index, 1);
    this.saveToLocalFile();
    return true;
  }

  public async deleteMany(ids: string[]): Promise<number> {
    const initialLen = this.localProducts.length;
    this.localProducts = this.localProducts.filter((p) => !ids.includes(p._id));
    const deletedCount = initialLen - this.localProducts.length;

    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        await this.mongoCollection.deleteMany({ _id: { $in: ids } } as any);
      } catch (e) {
        console.error('Mongo deleteMany failed:', e);
      }
    }

    this.saveToLocalFile();
    return deletedCount;
  }

  public async getCategories(): Promise<string[]> {
    const set = new Set<string>();
    this.localProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }

  public async resetDefaults(): Promise<ProductDocument[]> {
    this.localProducts = initialGroceryProducts.map((item, idx) => ({
      ...item,
      _id: generateObjectId(),
      createdAt: new Date(Date.now() - (initialGroceryProducts.length - idx) * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (this.isConnectedToMongo && this.mongoCollection) {
      try {
        await this.mongoCollection.deleteMany({});
        await this.mongoCollection.insertMany(this.localProducts as any);
      } catch (e) {
        console.error('Mongo reset failed:', e);
      }
    }

    this.saveToLocalFile();
    return this.localProducts;
  }
}

export const db = new NoSQLGroceryDatabase();
