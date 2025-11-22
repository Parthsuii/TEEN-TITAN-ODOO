const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // NEW
const { PrismaClient } = require('@prisma/client');
const authRouter = require('./auth'); // NEW

const prisma = new PrismaClient();
const app = express();
const PORT = 4000;

// 1. UPDATED CORS (Required for Cookies to work)
app.use(cors({
  origin: 'http://localhost:5173', // Your Frontend URL
  credentials: true // Allow cookies
}));

app.use(express.json());
app.use(cookieParser()); // NEW: Parse cookies from requests

// ---------- ROUTES ----------

// 1. AUTHENTICATION (Register, Login, Me)
app.use('/api/auth', authRouter);

// 2. DASHBOARD
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();
    const recentMovements = await prisma.stockMovement.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: { product: true, fromLocation: true, toLocation: true }
    });
    const stockLevels = await prisma.stockItem.findMany({ include: { product: true, location: true } });
    res.json({ totalProducts, recentMovements, stockLevels });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. LOCATIONS
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
    res.json(locations);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { name, type, address } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const location = await prisma.location.create({
      data: { name, type: type || 'internal', address: address || null }
    });
    res.json(location);
  } catch (error) { res.status(500).json({ error: "Error creating location" }); }
});

// 4. PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    res.json({ products });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name required' });
    const product = await prisma.product.create({ data: { name, sku: sku || null, category: category || null } });
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. MOVEMENTS (IN / OUT / TRANSFER)
// Helpers
async function updateOrCreateStockItem(tx, productId, locationId, delta) {
  if (!productId || !locationId) throw new Error('Missing ID');
  const existing = await tx.stockItem.findFirst({ where: { productId, locationId } });
  if (existing) {
    if (delta < 0 && existing.quantity + delta < 0) throw new Error('Insufficient stock at location');
    return tx.stockItem.update({ where: { id: existing.id }, data: { quantity: { increment: delta } } });
  } else {
    if (delta < 0) throw new Error('No stock to decrement');
    return tx.stockItem.create({ data: { productId, locationId, quantity: delta } });
  }
}

async function resolveProduct(tx, idOrSku) {
  if (!idOrSku) return null;
  let p = null;
  try { p = await tx.product.findUnique({ where: { id: idOrSku } }); } catch (e) {}
  if (p) return p;
  return tx.product.findFirst({ where: { sku: idOrSku } });
}

app.post('/api/movements', async (req, res) => {
  let { type, productId, quantity, fromLocationId, toLocationId, reference, partner, locationId } = req.body;

  if (locationId) {
    if (type === 'IN' && !toLocationId) toLocationId = locationId;
    if (type === 'OUT' && !fromLocationId) fromLocationId = locationId;
  }

  if (!type || !['IN', 'OUT', 'TRANSFER'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  if (!productId) return res.status(400).json({ error: 'productId required' });

  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: 'quantity must be positive' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await resolveProduct(tx, productId);
      if (!product) throw new Error('Product not found');
      const pid = product.id;

      if (type === 'IN') {
        if (!toLocationId) throw new Error('Destination required');
        const m = await tx.stockMovement.create({
          data: { type, productId: pid, quantity: qty, toLocationId, reference, partner }
        });
        await updateOrCreateStockItem(tx, pid, toLocationId, qty);
        return m;
      }

      if (type === 'OUT') {
        if (!fromLocationId) throw new Error('Source required');
        const stock = await tx.stockItem.findFirst({ where: { productId: pid, locationId: fromLocationId } });
        if (!stock || stock.quantity < qty) throw new Error('Insufficient stock');
        
        const m = await tx.stockMovement.create({
          data: { type, productId: pid, quantity: qty, fromLocationId, reference, partner }
        });
        await tx.stockItem.update({ where: { id: stock.id }, data: { quantity: { decrement: qty } } });
        return m;
      }

      if (type === 'TRANSFER') {
        if (!fromLocationId || !toLocationId) throw new Error('Source and Destination required');
        const stock = await tx.stockItem.findFirst({ where: { productId: pid, locationId: fromLocationId } });
        if (!stock || stock.quantity < qty) throw new Error('Insufficient stock');

        const m = await tx.stockMovement.create({
          data: { type, productId: pid, quantity: qty, fromLocationId, toLocationId, reference, partner }
        });
        await tx.stockItem.update({ where: { id: stock.id }, data: { quantity: { decrement: qty } } });
        await updateOrCreateStockItem(tx, pid, toLocationId, qty);
        return m;
      }
    });

    res.status(201).json({ success: true, movement: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// SEED
app.post('/api/seed', async (req, res) => {
  try {
    const names = ['Main Warehouse', 'Production Floor', 'Showroom'];
    for (const name of names) {
      const exists = await prisma.location.findFirst({ where: { name } });
      if (!exists) await prisma.location.create({ data: { name, type: 'internal' } });
    }
    res.json({ message: 'Seed complete' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));