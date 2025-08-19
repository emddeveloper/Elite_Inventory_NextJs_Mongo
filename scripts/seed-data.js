const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Sample data
const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    sku: 'IPH15PRO-001',
    description: 'Latest iPhone with advanced camera system',
    category: 'Electronics',
    price: 999.99,
    cost: 750.00,
    quantity: 25,
    minQuantity: 10,
    location: 'Warehouse A',
    tags: ['smartphone', 'apple', 'camera'],
    isActive: true
  },
  {
    name: 'MacBook Air M2',
    sku: 'MBA-M2-001',
    description: 'Lightweight laptop with M2 chip',
    category: 'Electronics',
    price: 1199.99,
    cost: 900.00,
    quantity: 15,
    minQuantity: 8,
    location: 'Warehouse A',
    tags: ['laptop', 'apple', 'm2'],
    isActive: true
  },
  {
    name: 'Nike Air Max 270',
    sku: 'NIKE-AM270-001',
    description: 'Comfortable running shoes',
    category: 'Sports',
    price: 129.99,
    cost: 80.00,
    quantity: 50,
    minQuantity: 20,
    location: 'Warehouse B',
    tags: ['shoes', 'running', 'nike'],
    isActive: true
  },
  {
    name: 'The Great Gatsby',
    sku: 'BOOK-GATSBY-001',
    description: 'Classic American novel by F. Scott Fitzgerald',
    category: 'Books',
    price: 12.99,
    cost: 8.00,
    quantity: 100,
    minQuantity: 30,
    location: 'Warehouse C',
    tags: ['classic', 'fiction', 'literature'],
    isActive: true
  },
  {
    name: 'Coffee Maker',
    sku: 'HOME-COFFEE-001',
    description: 'Programmable coffee maker with timer',
    category: 'Home & Garden',
    price: 89.99,
    cost: 55.00,
    quantity: 8,
    minQuantity: 15,
    location: 'Warehouse B',
    tags: ['kitchen', 'appliance', 'coffee'],
    isActive: true
  },
  {
    name: 'Wireless Headphones',
    sku: 'ELEC-HEAD-001',
    description: 'Bluetooth noise-canceling headphones',
    category: 'Electronics',
    price: 199.99,
    cost: 120.00,
    quantity: 12,
    minQuantity: 10,
    location: 'Warehouse A',
    tags: ['audio', 'bluetooth', 'wireless'],
    isActive: true
  },
  {
    name: 'Yoga Mat',
    sku: 'SPORT-YOGA-001',
    description: 'Non-slip yoga mat for home workouts',
    category: 'Sports',
    price: 29.99,
    cost: 18.00,
    quantity: 75,
    minQuantity: 25,
    location: 'Warehouse B',
    tags: ['fitness', 'yoga', 'mat'],
    isActive: true
  },
  {
    name: 'Desk Lamp',
    sku: 'HOME-LAMP-001',
    description: 'LED desk lamp with adjustable brightness',
    category: 'Home & Garden',
    price: 45.99,
    cost: 28.00,
    quantity: 35,
    minQuantity: 20,
    location: 'Warehouse C',
    tags: ['lighting', 'desk', 'led'],
    isActive: true
  }
];

// Import the Product model
const Product = require('../models/Product');

async function seedData() {
  try {
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} sample products`);

    // Update some products to have different creation dates for chart data
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    
    for (let i = 0; i < products.length; i++) {
      const randomDate = new Date(
        sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
      );
      
      await Product.findByIdAndUpdate(products[i]._id, {
        createdAt: randomDate,
        updatedAt: randomDate
      });
    }

    console.log('Updated creation dates for chart data');
    console.log('Database seeded successfully!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
  }
}

seedData();
