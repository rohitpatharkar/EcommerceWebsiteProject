# ShopEase - Full-Stack E-commerce Application

A modern, full-featured e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### User Features
- User registration and authentication (JWT-based)
- Browse products with advanced filtering and search
- Product categories and subcategories
- Product reviews and ratings
- Shopping cart with persistent storage
- Wishlist functionality
- Secure checkout process
- Order tracking and history
- User profile management
- Address management

### Admin Features
- Comprehensive dashboard with analytics
- Product management (CRUD operations)
- Category management
- Order management with status updates
- User management (block/unblock)
- Coupon/discount management
- Review moderation
- Sales reports and analytics

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for routing
- **Context API** for state management

## Project Structure

```
ecommerce-app/
├── backend/                 # Node.js + Express API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js           # Entry point
│
└── frontend/               # React application
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── contexts/       # React contexts
    │   ├── layouts/        # Page layouts
    │   ├── pages/          # Page components
    │   ├── services/       # API services
    │   ├── types/          # TypeScript types
    │   └── utils/          # Helper functions
    ├── package.json
    └── vite.config.ts
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd ecommerce-app-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@shopease.com
ADMIN_PASSWORD=admin123
```

4. Seed the database with sample data:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Default Login Credentials

### Admin Account
- Email: `admin@shopease.com`
- Password: `admin123`

### Sample User Accounts
- Email: `john@example.com`
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address
- `GET /api/users/wishlist` - Get wishlist
- `POST /api/users/wishlist` - Add to wishlist
- `DELETE /api/users/wishlist/:productId` - Remove from wishlist

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `PUT /api/products/:id/stock` - Update stock (admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update item quantity
- `DELETE /api/cart/items/:itemId` - Remove item
- `DELETE /api/cart` - Clear cart
- `POST /api/cart/coupon` - Apply coupon
- `DELETE /api/cart/coupon` - Remove coupon

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (admin)
- `PUT /api/orders/admin/:id/status` - Update order status (admin)
- `PUT /api/orders/admin/:id/tracking` - Add tracking (admin)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `PUT /api/reviews/:id/helpful` - Mark helpful

### Coupons
- `GET /api/coupons` - Get active coupons
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons/admin/all` - Get all coupons (admin)
- `POST /api/coupons/admin` - Create coupon (admin)
- `PUT /api/coupons/admin/:id` - Update coupon (admin)
- `DELETE /api/coupons/admin/:id` - Delete coupon (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/sales-chart` - Sales chart data
- `GET /api/admin/top-products` - Top selling products
- `GET /api/admin/top-customers` - Top customers
- `GET /api/admin/inventory-report` - Inventory report
- `GET /api/admin/revenue-report` - Revenue report

## Features in Detail

### Product Management
- Multiple product images
- Variant support (size, color, etc.)
- Inventory tracking with SKU
- Product categories and subcategories
- Featured, New Arrival, and Bestseller flags
- Product reviews and ratings

### Shopping Cart
- Add/remove items
- Update quantities
- Apply coupon codes
- Persistent cart for logged-in users
- Guest cart with localStorage

### Order Management
- Order status tracking (pending, processing, shipped, delivered)
- Email notifications (configurable)
- Order history
- Invoice generation
- Return/Refund handling

### Payment Integration
- Mock payment gateway integration
- Support for multiple payment methods (Card, PayPal, COD)
- Secure payment processing

### Admin Dashboard
- Real-time sales analytics
- Order statistics
- Inventory alerts
- User activity tracking
- Revenue reports

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- Protected API routes
- Secure password reset flow

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support, email support@shopease.com or create an issue in the repository.
