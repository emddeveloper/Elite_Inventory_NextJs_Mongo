const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection string - prefer env var, fallback to local (force IPv4 localhost)
const rawMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory-management';
const MONGODB_URI = rawMongoUri.startsWith('mongodb://localhost')
  ? rawMongoUri.replace('mongodb://localhost', 'mongodb://127.0.0.1')
  : rawMongoUri;

// Safe logging (mask credentials)
const maskedUri = MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/)(.*?)(@|$)/, '$1***@$3');
console.log('🔗 Using MongoDB URI:', maskedUri);

// Use direct collection insert to avoid schema validation edge-cases during seeding

async function seedDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read the dashboard data JSON file
    const dashboardDataPath = path.join(__dirname, '../public/data/dashboard-data.json');
    const dashboardData = JSON.parse(fs.readFileSync(dashboardDataPath, 'utf8'));

    // Normalize types in case any sections are stringified
    const ensureParsed = (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };
    dashboardData.stats = ensureParsed(dashboardData.stats);
    dashboardData.chartData = ensureParsed(dashboardData.chartData);
    dashboardData.categoryStats = ensureParsed(dashboardData.categoryStats);
    dashboardData.recentActivity = ensureParsed(dashboardData.recentActivity);

    console.log('🧾 Types:', {
      stats: Array.isArray(dashboardData.stats),
      chartData: Array.isArray(dashboardData.chartData),
      categoryStats: Array.isArray(dashboardData.categoryStats),
      recentActivity: Array.isArray(dashboardData.recentActivity)
    });

    // Clear existing dashboard data
    await mongoose.connection.db.collection('dashboards').deleteMany({});
    console.log('🗑️  Cleared existing dashboard data');

    // Insert new dashboard data
    await mongoose.connection.db.collection('dashboards').insertOne({
      ...dashboardData,
      lastUpdated: new Date()
    });
    console.log('✅ Dashboard data seeded successfully');

    // Verify the data was inserted
    const count = await mongoose.connection.db.collection('dashboards').countDocuments();
    console.log(`📊 Total dashboard records: ${count}`);

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seeding function
seedDashboardData();
