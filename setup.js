const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Inventory Management System...\n');

// Check if .env.local already exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Skipping environment setup.');
} else {
  // Read the example file
  const examplePath = path.join(__dirname, 'env.example');
  if (fs.existsSync(examplePath)) {
    const envContent = fs.readFileSync(examplePath, 'utf8');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file from env.example');
    console.log('📝 Please update the MongoDB connection string in .env.local');
  } else {
    console.log('❌ env.example not found. Please create .env.local manually.');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Update MONGODB_URI in .env.local with your MongoDB connection string');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\n🎉 Setup complete!');
