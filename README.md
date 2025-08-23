# AI Inventory Management System

A modern inventory management system built with Next.js, MongoDB, and AI-powered features.

## Features

- **Dashboard Analytics**: Real-time charts and statistics
- **Product Management**: Add, edit, and track inventory items
- **Supplier Management**: Manage supplier relationships
- **Real-time Updates**: Live inventory tracking
- **Responsive Design**: Works on all devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-inventory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/inventory_db
```

4. Seed the database with sample data (optional):
```bash
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

### Dashboard API

**GET** `/api/dashboard`

Returns real-time dashboard data including:
- Statistics (total products, value, low stock items, monthly sales)
- Chart data for sales and inventory trends
- Category distribution
- Recent activity

**Fallback Data**: `/data/dashboard-data.json`

When the API is unavailable, the dashboard automatically loads demo data from this JSON file in the public directory, ensuring the application remains functional even without database connectivity.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "name": "Total Products",
        "stat": "8",
        "change": "+12%",
        "changeType": "increase"
      }
    ],
    "chartData": [
      {
        "name": "Jan",
        "sales": 45000,
        "inventory": 320
      }
    ],
    "categoryStats": [
      {
        "_id": "Electronics",
        "count": 3,
        "totalValue": 2399.97
      }
    ],
    "recentActivity": [
      {
        "id": "...",
        "action": "Product updated",
        "item": "iPhone 15 Pro",
        "time": "2 minutes ago",
        "type": "update"
      }
    ]
  }
}
```

### Products API

**GET** `/api/products` - List all products
**POST** `/api/products` - Create a new product
**GET** `/api/products/[id]` - Get a specific product
**PUT** `/api/products/[id]` - Update a product
**DELETE** `/api/products/[id]` - Delete a product

## Dashboard Features

The dashboard provides:

1. **Statistics Cards**: Key metrics with trend indicators
2. **Bar Chart**: Sales and inventory trends over time
3. **Pie Chart**: Product distribution by category
4. **Recent Activity**: Latest product updates and alerts
5. **Automatic Fallback**: Demo data when API is unavailable
6. **Data Source Toggle**: Switch between live and demo data
7. **Error Handling**: Graceful degradation with user-friendly messages

## Database Schema

### Product Model
- Basic info (name, SKU, description)
- Pricing (cost, price)
- Inventory (quantity, minimum quantity)
- Categorization (category, tags)
- Metadata (supplier, location, timestamps)

## Technologies Used

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Icons**: Heroicons

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
