# Dashboard System Guide

## Overview

The dashboard system provides real-time inventory analytics with automatic fallback to demo data when the API is unavailable. This ensures the application remains functional even during connectivity issues or database downtime.

## Architecture

### 1. Data Sources

- **Primary Source**: `/api/dashboard` - Real-time data from MongoDB
- **Fallback Source**: `/data/dashboard-data.json` - Static demo data (located in `public/data/`)
- **Automatic Switching**: Seamless fallback when primary source fails

### 2. Components

- **Dashboard Component** (`components/Dashboard.tsx`): Main UI component
- **Dashboard API** (`app/api/dashboard/route.ts`): Backend data endpoint
- **Utility Functions** (`lib/dashboard-utils.ts`): Data fetching logic
- **Type Definitions** (`types/dashboard.ts`): TypeScript interfaces
- **Demo Data** (`public/data/dashboard-data.json`): Fallback data structure

## How It Works

### 1. Initial Load
```typescript
useEffect(() => {
  loadDashboardData()
}, [])
```

The dashboard attempts to load data from the API first.

### 2. API Priority
```typescript
const result = await fetchDashboardData()
// This function tries API first, then falls back to demo data
```

### 3. Automatic Fallback
If the API fails:
- Error is logged
- Demo data is automatically loaded
- User sees a clear indicator of data source
- Dashboard remains fully functional

### 4. User Control
Users can:
- See which data source is active (Live/Demo)
- Manually retry API connection
- Reload data from either source

## Data Flow

```
User Request → Dashboard Component
                    ↓
            fetchDashboardData()
                    ↓
            Try API (/api/dashboard)
                    ↓
            Success? → Display Live Data
                    ↓
            Failure? → Load Demo Data (/data/dashboard-data.json)
                    ↓
            Display Demo Data + Source Indicator
```

## Features

### 1. Statistics Cards
- Total Products
- Total Inventory Value
- Low Stock Items
- Monthly Sales
- Trend indicators (+/- percentages)

### 2. Charts
- **Bar Chart**: Sales vs Inventory trends over time
- **Pie Chart**: Product distribution by category
- Responsive design with tooltips

### 3. Recent Activity
- Product updates
- Stock alerts
- Sales transactions
- Time-based sorting

### 4. Smart Fallback
- Automatic detection of API availability
- Seamless data switching
- Clear user communication
- No data loss during outages

## Error Handling

### 1. API Failures
- Network timeouts (10 seconds)
- HTTP errors
- JSON parsing errors
- Database connection issues

### 2. Fallback Failures
- File not found
- JSON parsing errors
- Network issues

### 3. User Experience
- Loading states
- Error messages
- Retry options
- Data source indicators

## Testing

### 1. Manual Testing
```bash
# Start development server
npm run dev

# Visit dashboard
http://localhost:3000

# Test fallback (disconnect internet)
# Dashboard should automatically show demo data
```

### 2. Automated Testing
```bash
# Test dashboard functionality
npm run test:dashboard

# Seed database with sample data
npm run seed
```

### 3. Test Scenarios
- API available: Live data display
- API unavailable: Demo data fallback
- Network interruption: Automatic fallback
- Manual retry: Reconnection attempt
- Data refresh: Reload from current source

## Configuration

### 1. Timeouts
```typescript
// API timeout: 10 seconds
signal: AbortSignal.timeout(10000)

// Fallback timeout: 5 seconds
signal: AbortSignal.timeout(5000)
```

### 2. Data Sources
```typescript
// Primary API endpoint
'/api/dashboard'

// Fallback data file
'/data/dashboard-data.json'
```

### 3. Error Messages
- API failures: "API not available. Loading demo data..."
- Fallback failures: "Failed to load both API and fallback data"
- General errors: "An unexpected error occurred"

## Customization

### 1. Adding New Metrics
1. Update the API endpoint
2. Modify the demo data
3. Update TypeScript interfaces
4. Add UI components

### 2. Changing Fallback Data
1. Edit `/data/dashboard-data.json`
2. Ensure data structure matches API response
3. Update types if needed

### 3. Modifying Timeouts
1. Edit `lib/dashboard-utils.ts`
2. Adjust timeout values
3. Test with slow connections

## Best Practices

### 1. Data Consistency
- Keep demo data structure identical to API response
- Use realistic but safe demo values
- Include all required fields

### 2. Error Handling
- Always provide fallback options
- Log errors for debugging
- Show user-friendly messages

### 3. Performance
- Use appropriate timeouts
- Implement loading states
- Cache data when possible

### 4. User Experience
- Clear data source indicators
- Smooth transitions between states
- Helpful error messages
- Easy retry mechanisms

## Troubleshooting

### 1. Dashboard Not Loading
- Check API endpoint availability
- Verify fallback data file exists
- Check browser console for errors
- Verify MongoDB connection

### 2. Demo Data Not Showing
- Check file path: `public/data/dashboard-data.json`
- Verify JSON syntax
- Check file permissions
- Ensure proper MIME type

### 3. API Errors
- Check MongoDB connection
- Verify database models
- Check API route configuration
- Review server logs

### 4. Performance Issues
- Reduce timeout values
- Optimize database queries
- Implement data caching
- Use pagination for large datasets

## Future Enhancements

### 1. Caching
- Implement Redis caching
- Cache API responses
- Cache demo data

### 2. Real-time Updates
- WebSocket connections
- Server-sent events
- Polling mechanisms

### 3. Advanced Analytics
- Machine learning insights
- Predictive analytics
- Custom report generation

### 4. Multi-source Support
- Multiple API endpoints
- Data aggregation
- Cross-platform sync

---

This dashboard system provides a robust, user-friendly way to display inventory analytics with built-in resilience against connectivity issues.
