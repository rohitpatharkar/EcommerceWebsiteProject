// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  addresses: Address[];
  wishlist: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | Category;
  subcategories?: Category[];
  isActive: boolean;
  order: number;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  category: Category | string;
  subcategory?: Category | string;
  images: ProductImage[];
  brand?: string;
  tags: string[];
  variants: Variant[];
  inventory: InventoryItem[];
  totalQuantity: number;
  rating: {
    average: number;
    count: number;
    distribution: Record<number, number>;
  };
  reviewsCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  salesCount: number;
  createdAt: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface Variant {
  name: string;
  options: string[];
}

export interface InventoryItem {
  _id?: string;
  sku: string;
  quantity: number;
  lowStockThreshold?: number;
  variantCombination: Record<string, string>;
}

// Cart Types
export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  coupon: {
    code: string | null;
    discount: number;
    discountType: 'percentage' | 'fixed';
  };
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface CartItem {
  _id: string;
  product: Product | string;
  sku: string;
  quantity: number;
  price: number;
  variantDetails: Record<string, string>;
  addedAt: string;
}

// Order Types
export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  payment: {
    method: 'card' | 'paypal' | 'cod' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
    transactionId?: string;
    paidAt?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    couponCode: string | null;
    tax: number;
    shipping: number;
    total: number;
  };
  status: OrderStatus;
  timeline: TimelineEvent[];
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  };
  notes?: {
    customer?: string;
    internal?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';

export interface OrderItem {
  product: string | Product;
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  variantDetails: Record<string, string>;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface TimelineEvent {
  _id?: string;
  status: string;
  description: string;
  timestamp: string;
  updatedBy?: string;
}

// Review Types
export interface Review {
  _id: string;
  product: string | Product;
  user: User | string;
  order?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: { url: string }[];
  helpful: {
    count: number;
    users: string[];
  };
  verifiedPurchase: boolean;
  isActive: boolean;
  adminResponse?: {
    comment: string;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
}

// Coupon Types
export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number;
  maximumDiscount?: number;
  usageLimit: {
    total?: number;
    perUser?: number;
  };
  usageCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
    token: string;
    refreshToken?: string;
  };
}

// Filter Types
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  brand?: string;
  tags?: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  inStock?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  totalPages?: number;
  currentPage?: number;
}

// Dashboard Types
export interface DashboardStats {
  today: {
    orders: number;
    sales: number;
  };
  month: {
    orders: number;
    sales: number;
  };
  year: {
    orders: number;
    sales: number;
  };
  totals: {
    users: number;
    products: number;
    orders: number;
    categories: number;
  };
  pendingOrders: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
  ordersByStatus: { _id: string; count: number }[];
}
