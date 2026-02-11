const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');

// Sample data
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@shopease.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
    phone: '+1 555-0100'
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true,
    phone: '+1 555-0101',
    addresses: [
      {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: true
      }
    ]
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true,
    phone: '+1 555-0102'
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
    isVerified: true,
    phone: '+1 555-0103'
  }
];

const categories = [
  {
    name: 'Electronics',
    description: 'Latest gadgets and electronic devices',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=400',
    order: 1
  },
  {
    name: 'Fashion',
    description: 'Trendy clothing and accessories',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    order: 2
  },
  {
    name: 'Home & Living',
    description: 'Everything for your home',
    image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    order: 3
  },
  {
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400',
    order: 4
  },
  {
    name: 'Books',
    description: 'Books across all genres',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    order: 5
  }
];

const subcategories = [
  // Electronics subcategories
  { name: 'Smartphones', description: 'Mobile phones and accessories', parent: 'Electronics' },
  { name: 'Laptops', description: 'Computers and laptops', parent: 'Electronics' },
  { name: 'Audio', description: 'Headphones and speakers', parent: 'Electronics' },
  { name: 'Cameras', description: 'Digital cameras and accessories', parent: 'Electronics' },
  
  // Fashion subcategories
  { name: 'Men\'s Clothing', description: 'Clothing for men', parent: 'Fashion' },
  { name: 'Women\'s Clothing', description: 'Clothing for women', parent: 'Fashion' },
  { name: 'Shoes', description: 'Footwear for all', parent: 'Fashion' },
  { name: 'Accessories', description: 'Fashion accessories', parent: 'Fashion' },
  
  // Home & Living subcategories
  { name: 'Furniture', description: 'Home furniture', parent: 'Home & Living' },
  { name: 'Decor', description: 'Home decorations', parent: 'Home & Living' },
  { name: 'Kitchen', description: 'Kitchen appliances and tools', parent: 'Home & Living' },
  
  // Sports subcategories
  { name: 'Fitness', description: 'Fitness equipment', parent: 'Sports & Outdoors' },
  { name: 'Outdoor', description: 'Outdoor gear', parent: 'Sports & Outdoors' }
];

const products = [
  {
    name: 'iPhone 15 Pro',
    description: 'The most advanced iPhone ever with A17 Pro chip, titanium design, and 48MP camera system.',
    shortDescription: 'Latest iPhone with pro camera system',
    price: 999.99,
    comparePrice: 1099.99,
    category: 'Electronics',
    subcategory: 'Smartphones',
    brand: 'Apple',
    tags: ['smartphone', 'iphone', 'apple', '5g'],
    images: [
      { url: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=600', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=600' }
    ],
    inventory: [
      { sku: 'IPH15P-128-BLK', quantity: 50, variantCombination: { storage: '128GB', color: 'Black' } },
      { sku: 'IPH15P-256-BLK', quantity: 30, variantCombination: { storage: '256GB', color: 'Black' } },
      { sku: 'IPH15P-128-WHT', quantity: 40, variantCombination: { storage: '128GB', color: 'White' } }
    ],
    variants: [
      { name: 'storage', options: ['128GB', '256GB', '512GB'] },
      { name: 'color', options: ['Black', 'White', 'Blue'] }
    ],
    isFeatured: true,
    isNewArrival: true,
    rating: { average: 4.8, count: 125 }
  },
  {
    name: 'MacBook Pro 14"',
    description: 'Supercharged by M3 Pro or M3 Max, MacBook Pro delivers a game-changing combination of performance and battery life.',
    shortDescription: 'Professional laptop with M3 chip',
    price: 1999.99,
    comparePrice: 2199.99,
    category: 'Electronics',
    subcategory: 'Laptops',
    brand: 'Apple',
    tags: ['laptop', 'macbook', 'apple', 'pro'],
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'MBP14-512-SGR', quantity: 25, variantCombination: { storage: '512GB', color: 'Space Gray' } },
      { sku: 'MBP14-1TB-SGR', quantity: 15, variantCombination: { storage: '1TB', color: 'Space Gray' } }
    ],
    variants: [
      { name: 'storage', options: ['512GB', '1TB', '2TB'] },
      { name: 'color', options: ['Space Gray', 'Silver'] }
    ],
    isFeatured: true,
    rating: { average: 4.9, count: 89 }
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling with two processors controlling eight microphones.',
    shortDescription: 'Premium noise-canceling headphones',
    price: 399.99,
    comparePrice: 449.99,
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'Sony',
    tags: ['headphones', 'audio', 'wireless', 'noise-canceling'],
    images: [
      { url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'SONY-XM5-BLK', quantity: 60, variantCombination: { color: 'Black' } },
      { sku: 'SONY-XM5-SLV', quantity: 45, variantCombination: { color: 'Silver' } }
    ],
    variants: [
      { name: 'color', options: ['Black', 'Silver'] }
    ],
    isBestseller: true,
    rating: { average: 4.7, count: 234 }
  },
  {
    name: 'Nike Air Max 270',
    description: 'The Nike Air Max 270 delivers visible cushioning under every step.',
    shortDescription: 'Comfortable running shoes',
    price: 150.00,
    comparePrice: 180.00,
    category: 'Fashion',
    subcategory: 'Shoes',
    brand: 'Nike',
    tags: ['shoes', 'sneakers', 'running', 'nike'],
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'NIKE-270-8-BLK', quantity: 30, variantCombination: { size: '8', color: 'Black' } },
      { sku: 'NIKE-270-9-BLK', quantity: 25, variantCombination: { size: '9', color: 'Black' } },
      { sku: 'NIKE-270-10-BLK', quantity: 20, variantCombination: { size: '10', color: 'Black' } }
    ],
    variants: [
      { name: 'size', options: ['7', '8', '9', '10', '11', '12'] },
      { name: 'color', options: ['Black', 'White', 'Red'] }
    ],
    isFeatured: true,
    isBestseller: true,
    rating: { average: 4.5, count: 567 }
  },
  {
    name: 'Adidas Ultraboost 22',
    description: 'Running shoes with incredible energy return and comfort.',
    shortDescription: 'High-performance running shoes',
    price: 190.00,
    comparePrice: 220.00,
    category: 'Fashion',
    subcategory: 'Shoes',
    brand: 'Adidas',
    tags: ['shoes', 'running', 'adidas', 'sports'],
    images: [
      { url: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'ADID-UB22-8-WHT', quantity: 40, variantCombination: { size: '8', color: 'White' } },
      { sku: 'ADID-UB22-9-WHT', quantity: 35, variantCombination: { size: '9', color: 'White' } }
    ],
    variants: [
      { name: 'size', options: ['7', '8', '9', '10', '11'] },
      { name: 'color', options: ['White', 'Black', 'Gray'] }
    ],
    isNewArrival: true,
    rating: { average: 4.6, count: 312 }
  },
  {
    name: 'Modern Sofa',
    description: 'Comfortable 3-seater sofa with premium fabric upholstery.',
    shortDescription: 'Elegant living room sofa',
    price: 899.99,
    comparePrice: 1199.99,
    category: 'Home & Living',
    subcategory: 'Furniture',
    brand: 'HomeComfort',
    tags: ['furniture', 'sofa', 'living-room', 'home'],
    images: [
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'SOFA-3S-GRY', quantity: 10, variantCombination: { color: 'Gray' } },
      { sku: 'SOFA-3S-BLU', quantity: 8, variantCombination: { color: 'Blue' } }
    ],
    variants: [
      { name: 'color', options: ['Gray', 'Blue', 'Beige'] }
    ],
    isFeatured: true,
    rating: { average: 4.4, count: 78 }
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with thermal carafe and brew strength control.',
    shortDescription: 'Automatic drip coffee maker',
    price: 129.99,
    comparePrice: 159.99,
    category: 'Home & Living',
    subcategory: 'Kitchen',
    brand: 'BrewMaster',
    tags: ['kitchen', 'coffee', 'appliance'],
    images: [
      { url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'COFFEE-BM-01', quantity: 50, variantCombination: {} }
    ],
    isBestseller: true,
    rating: { average: 4.3, count: 445 }
  },
  {
    name: 'Yoga Mat',
    description: 'Premium non-slip yoga mat with extra cushioning for comfort.',
    shortDescription: 'Eco-friendly exercise mat',
    price: 49.99,
    comparePrice: 69.99,
    category: 'Sports & Outdoors',
    subcategory: 'Fitness',
    brand: 'ZenFit',
    tags: ['fitness', 'yoga', 'exercise', 'mat'],
    images: [
      { url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'YOGA-ZF-PUR', quantity: 100, variantCombination: { color: 'Purple' } },
      { sku: 'YOGA-ZF-GRN', quantity: 80, variantCombination: { color: 'Green' } }
    ],
    variants: [
      { name: 'color', options: ['Purple', 'Green', 'Blue', 'Pink'] }
    ],
    rating: { average: 4.7, count: 234 }
  },
  {
    name: 'Dumbbell Set',
    description: 'Adjustable dumbbell set from 5 to 52.5 lbs.',
    shortDescription: 'Home gym dumbbell set',
    price: 299.99,
    comparePrice: 399.99,
    category: 'Sports & Outdoors',
    subcategory: 'Fitness',
    brand: 'PowerLift',
    tags: ['fitness', 'weights', 'dumbbells', 'home-gym'],
    images: [
      { url: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'DUMB-PL-52', quantity: 20, variantCombination: {} }
    ],
    isFeatured: true,
    rating: { average: 4.8, count: 156 }
  },
  {
    name: 'The Great Gatsby',
    description: 'F. Scott Fitzgerald\'s classic novel of the Jazz Age.',
    shortDescription: 'Classic American literature',
    price: 14.99,
    comparePrice: 19.99,
    category: 'Books',
    brand: 'Penguin Classics',
    tags: ['book', 'fiction', 'classic', 'literature'],
    images: [
      { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', isPrimary: true }
    ],
    inventory: [
      { sku: 'BOOK-GATSBY-HC', quantity: 200, variantCombination: { format: 'Hardcover' } },
      { sku: 'BOOK-GATSBY-PB', quantity: 300, variantCombination: { format: 'Paperback' } }
    ],
    variants: [
      { name: 'format', options: ['Hardcover', 'Paperback', 'E-book'] }
    ],
    rating: { average: 4.6, count: 892 }
  }
];

const coupons = [
  {
    code: 'WELCOME20',
    description: '20% off your first order',
    discountType: 'percentage',
    discountValue: 20,
    minimumPurchase: 50,
    maximumDiscount: 100,
    usageLimit: { total: 1000, perUser: 1 },
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'SAVE50',
    description: '$50 off orders over $200',
    discountType: 'fixed',
    discountValue: 50,
    minimumPurchase: 200,
    usageLimit: { total: 500 },
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'FLASH15',
    description: '15% off flash sale',
    discountType: 'percentage',
    discountValue: 15,
    minimumPurchase: 0,
    usageLimit: { total: 200 },
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();

    console.log('Data cleared...');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users created`);

    // Create categories
    const createdCategories = await Category.create(categories);
    console.log(`${createdCategories.length} categories created`);

    // Create subcategories
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    const subcategoryDocs = subcategories.map(sub => ({
      ...sub,
      parent: categoryMap[sub.parent]
    }));

    const createdSubcategories = await Category.create(subcategoryDocs);
    console.log(`${createdSubcategories.length} subcategories created`);

    // Update category map with subcategories
    createdSubcategories.forEach(sub => {
      categoryMap[sub.name] = sub._id;
    });

    // Create products
    const productDocs = products.map(prod => ({
      ...prod,
      category: categoryMap[prod.category],
      subcategory: categoryMap[prod.subcategory] || null,
      totalQuantity: prod.inventory.reduce((sum, item) => sum + item.quantity, 0)
    }));

    const createdProducts = await Product.create(productDocs);
    console.log(`${createdProducts.length} products created`);

    // Create coupons
    const createdCoupons = await Coupon.create(coupons);
    console.log(`${createdCoupons.length} coupons created`);

    console.log('Data imported successfully!');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete all data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Coupon.deleteMany();

    console.log('Data destroyed!');
    process.exit();
  } catch (error) {
    console.error('Error deleting data:', error);
    process.exit(1);
  }
};

// Run script
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}
