const fs = require('fs');
const path = require('path');

function verifyFallbackData() {
  console.log('🔍 Verifying fallback data accessibility...\n');
  
  const fallbackPath = path.join(__dirname, '..', 'public', 'data', 'dashboard-data.json');
  
  try {
    // Check if file exists
    if (fs.existsSync(fallbackPath)) {
      console.log('✅ Fallback data file exists at:', fallbackPath);
      
      // Check if file is readable
      const stats = fs.statSync(fallbackPath);
      console.log('📁 File size:', stats.size, 'bytes');
      console.log('📅 Last modified:', stats.mtime);
      
      // Try to read and parse the file
      const fileContent = fs.readFileSync(fallbackPath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      console.log('✅ JSON is valid');
      console.log('📊 Data structure:');
      console.log(`   - Stats: ${jsonData.stats?.length || 0} items`);
      console.log(`   - Chart Data: ${jsonData.chartData?.length || 0} items`);
      console.log(`   - Categories: ${jsonData.categoryStats?.length || 0} items`);
      console.log(`   - Activities: ${jsonData.recentActivity?.length || 0} items`);
      
      // Verify required fields
      const requiredFields = ['stats', 'chartData', 'categoryStats', 'recentActivity'];
      const missingFields = requiredFields.filter(field => !jsonData[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields are present');
      } else {
        console.log('❌ Missing required fields:', missingFields);
      }
      
    } else {
      console.log('❌ Fallback data file not found at:', fallbackPath);
      console.log('💡 Make sure the file is located in the public/data/ directory');
    }
    
  } catch (error) {
    console.error('❌ Error verifying fallback data:', error.message);
  }
  
  console.log('\n🎯 Verification complete!');
  console.log('\nTo test the fallback in the browser:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Visit: http://localhost:3000/data/dashboard-data.json');
  console.log('3. You should see the JSON data displayed');
  console.log('4. If you see a 404, check the file location and server configuration');
}

// Run verification if script is called directly
if (require.main === module) {
  verifyFallbackData();
}

module.exports = { verifyFallbackData };
