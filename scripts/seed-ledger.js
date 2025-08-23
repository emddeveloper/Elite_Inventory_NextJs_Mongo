const mongoose = require('mongoose');
require('dotenv').config();

const rawMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory-management';
const MONGODB_URI = rawMongoUri.startsWith('mongodb://localhost')
  ? rawMongoUri.replace('mongodb://localhost', 'mongodb://127.0.0.1')
  : rawMongoUri;
const maskedUri = MONGODB_URI.includes('@') ? MONGODB_URI.replace(/\/\/.*@/, '//***@') : MONGODB_URI;
console.log('🔗 Using MongoDB URI:', maskedUri);

async function seedLedger() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await mongoose.connection.db.collection('products').find({}).limit(5).toArray();
    if (!products.length) {
      console.log('No products found. Run: node scripts/seed-data.js');
      await mongoose.connection.close();
      return;
    }

    const ledgerCol = mongoose.connection.db.collection('inventoryledgers');
    await ledgerCol.deleteMany({});

    const entries = [];
    const now = new Date();

    for (const p of products) {
      // Opening balance (adjustment to current qty)
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'ADJUSTMENT',
        quantity: Math.max(0, p.quantity || 0),
        source: 'opening',
        note: 'Opening balance',
        balanceAfter: p.quantity || 0,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
      });
      // Purchase IN
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'IN',
        quantity: 5,
        unitCost: p.cost,
        source: 'purchase',
        reference: 'PO-1001',
        note: 'Supplier restock',
        balanceAfter: (p.quantity || 0) + 5,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      });
      // Sale OUT
      entries.push({
        productId: p._id,
        sku: p.sku,
        productName: p.name,
        type: 'OUT',
        quantity: 2,
        unitPrice: p.price,
        source: 'sale',
        reference: 'INV-5001',
        note: 'Customer sale',
        balanceAfter: (p.quantity || 0) + 3,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      });
    }

    const res = await ledgerCol.insertMany(entries);

    // Sync product quantities to last balanceAfter per SKU
    const pipeline = [
      { $sort: { createdAt: 1 } },
      { $group: { _id: '$sku', balanceAfter: { $last: '$balanceAfter' } } },
    ];
    const latest = await ledgerCol.aggregate(pipeline).toArray();
    for (const row of latest) {
      await mongoose.connection.db.collection('products').updateOne({ sku: row._id }, { $set: { quantity: row.balanceAfter } });
    }

    console.log(`Inserted ${res.insertedCount || Object.keys(res.insertedIds).length} ledger entries.`);
    await mongoose.connection.close();
  } catch (e) {
    console.error('Error seeding ledger:', e);
    try { await mongoose.connection.close(); } catch {}
  }
}

seedLedger();
