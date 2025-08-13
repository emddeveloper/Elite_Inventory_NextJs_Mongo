# Inventory Management System

A modern, full-featured inventory management system built with Next.js 14, MongoDB, and Tailwind CSS. This application provides comprehensive inventory tracking, product management, supplier management, and real-time analytics.

## Features

### 🏠 Dashboard
- Real-time overview of inventory metrics
- Interactive charts and analytics
- Recent activity feed
- Quick access to key functions

### 📦 Product Management
- Add, edit, and delete products
- SKU-based product tracking
- Category organization
- Stock level monitoring
- Price and cost tracking
- Location management

### 📊 Inventory Tracking
- Real-time stock levels
- Low stock alerts
- Stock status indicators
- Inventory value calculations
- Profit margin tracking

### 🏢 Supplier Management
- Supplier information storage
- Contact person details
- Payment terms tracking
- Supplier-product relationships

### 📈 Analytics & Reporting
- Sales trends visualization
- Category distribution charts
- Inventory value tracking
- Performance metrics

### 🔍 Search & Filtering
- Advanced search functionality
- Category-based filtering
- Real-time search results
- Sortable data tables

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: MongoDB with Mongoose ODM
- **Charts**: Recharts
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form

## Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- MongoDB installed and running locally, or a MongoDB Atlas account
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/inventory-management
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── products/      # Product API endpoints
│   │   └── suppliers/     # Supplier API endpoints
│   ├── products/          # Products page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── Dashboard.tsx      # Dashboard component
│   ├── Header.tsx         # Header component
│   └── Sidebar.tsx        # Sidebar navigation
├── lib/                   # Utility functions
│   └── mongodb.ts         # MongoDB connection
├── models/                # Mongoose models
│   ├── Product.ts         # Product schema
│   └── Supplier.ts        # Supplier schema
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## API Endpoints

### Products
- `GET /api/products` - Get all products with pagination and filtering
- `POST /api/products` - Create a new product
- `GET /api/products/[id]` - Get a specific product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create a new supplier
- `GET /api/suppliers/[id]` - Get a specific supplier
- `PUT /api/suppliers/[id]` - Update a supplier
- `DELETE /api/suppliers/[id]` - Delete a supplier

## Database Schema

### Product Schema
```typescript
{
  name: string,
  sku: string (unique),
  description: string,
  category: string,
  price: number,
  cost: number,
  quantity: number,
  minQuantity: number,
  supplier: ObjectId,
  location: string,
  image: string,
  tags: string[],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Supplier Schema
```typescript
{
  name: string,
  email: string (unique),
  phone: string,
  address: {
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  contactPerson: {
    name: string,
    email: string,
    phone: string
  },
  paymentTerms: string,
  isActive: boolean,
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage

### Adding Products
1. Navigate to the Products page
2. Click "Add Product" button
3. Fill in the product details
4. Click "Add Product" to save

### Managing Inventory
- View current stock levels on the dashboard
- Monitor low stock alerts
- Update quantities as needed
- Track inventory value

### Viewing Analytics
- Check the dashboard for overview metrics
- View sales trends and category distribution
- Monitor recent activity

## Customization

### Adding New Categories
Edit the `categories` array in the Product model and update the frontend components accordingly.

### Customizing Styling
Modify the Tailwind CSS configuration in `tailwind.config.js` and update component styles.

### Extending Features
Add new API endpoints in the `app/api` directory and create corresponding frontend components.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: This is a demo application. For production use, consider adding:
- User authentication and authorization
- Data validation and sanitization
- Error logging and monitoring
- Backup and recovery procedures
- Performance optimization
- Security hardening
