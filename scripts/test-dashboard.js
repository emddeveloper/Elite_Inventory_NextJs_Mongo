const fetch = require('node-fetch');

async function testDashboardAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Dashboard API...\n');
  
  try {
    // Test 1: Check if the API endpoint is accessible
    console.log('1. Testing API endpoint accessibility...');
    const apiResponse = await fetch(`${baseUrl}/api/dashboard`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API endpoint accessible');
      console.log(`   - Status: ${apiResponse.status}`);
      console.log(`   - Success: ${apiData.success}`);
      console.log(`   - Data available: ${apiData.data ? 'Yes' : 'No'}`);
      
      if (apiData.data) {
        console.log(`   - Stats count: ${apiData.data.stats?.length || 0}`);
        console.log(`   - Chart data points: ${apiData.data.chartData?.length || 0}`);
        console.log(`   - Categories: ${apiData.data.categoryStats?.length || 0}`);
        console.log(`   - Recent activities: ${apiData.data.recentActivity?.length || 0}`);
      }
    } else {
      console.log('❌ API endpoint not accessible');
      console.log(`   - Status: ${apiResponse.status}`);
      console.log(`   - Status Text: ${apiResponse.statusText}`);
    }
    
    console.log('');
    
    // Test 2: Check if fallback data is accessible
    console.log('2. Testing fallback data accessibility...');
    const fallbackResponse = await fetch(`${baseUrl}/data/dashboard-data.json`);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      console.log('✅ Fallback data accessible');
      console.log(`   - Status: ${fallbackResponse.status}`);
      console.log(`   - Stats count: ${fallbackData.stats?.length || 0}`);
      console.log(`   - Chart data points: ${fallbackData.chartData?.length || 0}`);
      console.log(`   - Categories: ${fallbackData.categoryStats?.length || 0}`);
      console.log(`   - Recent activities: ${fallbackData.recentActivity?.length || 0}`);
    } else {
      console.log('❌ Fallback data not accessible');
      console.log(`   - Status: ${fallbackResponse.status}`);
      console.log(`   - Status Text: ${fallbackResponse.statusText}`);
    }
    
    console.log('');
    
    // Test 3: Check main dashboard page
    console.log('3. Testing main dashboard page...');
    const pageResponse = await fetch(`${baseUrl}/`);
    
    if (pageResponse.ok) {
      console.log('✅ Main dashboard page accessible');
      console.log(`   - Status: ${pageResponse.status}`);
      console.log(`   - Content-Type: ${pageResponse.headers.get('content-type')}`);
    } else {
      console.log('❌ Main dashboard page not accessible');
      console.log(`   - Status: ${pageResponse.status}`);
      console.log(`   - Status Text: ${pageResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
  
  console.log('\n🎯 Testing complete!');
  console.log('\nTo test the dashboard:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Try disconnecting your internet to test fallback functionality');
  console.log('4. Use the test page at http://localhost:3000/test-dashboard');
}

// Check if the script is run directly
if (require.main === module) {
  testDashboardAPI();
}

module.exports = { testDashboardAPI };
