import type { 
  ApiResponse, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  User,
  Product,
  ProductFilters,
  Category,
  Cart,
  Order,
  Review,
  Coupon,
  Address,
  DashboardStats
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('token');

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) => 
    fetchApi<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  adminLogin: (credentials: LoginCredentials) => 
    fetchApi<AuthResponse['data']>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (data: RegisterData) => 
    fetchApi<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => 
    fetchApi<User>('/auth/me'),

  updatePassword: (currentPassword: string, newPassword: string) => 
    fetchApi('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  forgotPassword: (email: string) => 
    fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token: string, password: string) => 
    fetchApi(`/auth/reset-password/${token}`, {
      method: 'PUT',
      body: JSON.stringify({ password })
    }),

  logout: () => 
    fetchApi('/auth/logout', {
      method: 'POST'
    })
};

// User API
export const userApi = {
  getProfile: () => 
    fetchApi<User>('/users/profile'),

  updateProfile: (data: Partial<User>) => 
    fetchApi<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAddresses: () => 
    fetchApi<Address[]>('/users/addresses'),

  addAddress: (address: Address) => 
    fetchApi<Address[]>('/users/addresses', {
      method: 'POST',
      body: JSON.stringify(address)
    }),

  updateAddress: (id: string, address: Address) => 
    fetchApi<Address[]>(`/users/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(address)
    }),

  deleteAddress: (id: string) => 
    fetchApi<Address[]>(`/users/addresses/${id}`, {
      method: 'DELETE'
    }),

  getWishlist: () => 
    fetchApi<Product[]>('/users/wishlist'),

  addToWishlist: (productId: string) => 
    fetchApi<string[]>('/users/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),

  removeFromWishlist: (productId: string) => 
    fetchApi<string[]>(`/users/wishlist/${productId}`, {
      method: 'DELETE'
    }),

  // Admin only
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    
    return fetchApi<User[]>(`/users?${queryParams.toString()}`);
  },

  toggleUserBlock: (id: string) => 
    fetchApi(`/users/${id}/block`, {
      method: 'PUT'
    })
};

// Product API
export const productApi = {
  getProducts: (filters?: ProductFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }
    
    return fetchApi<Product[]>(`/products?${queryParams.toString()}`);
  },

  getProduct: (id: string) => 
    fetchApi<Product>(`/products/${id}`),

  getProductBySlug: (slug: string) => 
    fetchApi<Product>(`/products/slug/${slug}`),

  getRelatedProducts: (id: string) => 
    fetchApi<Product[]>(`/products/${id}/related`),

  getFeaturedProducts: (limit = 8) => 
    fetchApi<Product[]>(`/products/featured?limit=${limit}`),

  getNewArrivals: (limit = 8) => 
    fetchApi<Product[]>(`/products/new-arrivals?limit=${limit}`),

  getBestsellers: (limit = 8) => 
    fetchApi<Product[]>(`/products/bestsellers?limit=${limit}`),

  getFilters: () => 
    fetchApi<{ categories: Category[]; brands: string[]; priceRange: { minPrice: number; maxPrice: number } }>('/products/filters'),

  // Admin only
  createProduct: (data: Partial<Product>) => 
    fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (id: string, data: Partial<Product>) => 
    fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteProduct: (id: string) => 
    fetchApi(`/products/${id}`, {
      method: 'DELETE'
    }),

  updateStock: (id: string, sku: string, quantity: number) => 
    fetchApi(`/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ sku, quantity })
    })
};

// Category API
export const categoryApi = {
  getCategories: () => 
    fetchApi<Category[]>('/categories'),

  getAllCategories: () => 
    fetchApi<Category[]>('/categories/all'),

  getCategory: (id: string) => 
    fetchApi<Category>(`/categories/${id}`),

  getCategoryBySlug: (slug: string) => 
    fetchApi<Category>(`/categories/slug/${slug}`),

  getCategoryTree: () => 
    fetchApi<Category[]>('/categories/tree'),

  // Admin only
  createCategory: (data: Partial<Category>) => 
    fetchApi<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCategory: (id: string, data: Partial<Category>) => 
    fetchApi<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCategory: (id: string) => 
    fetchApi(`/categories/${id}`, {
      method: 'DELETE'
    })
};

// Cart API
export const cartApi = {
  getCart: () => 
    fetchApi<Cart>('/cart'),

  addItem: (productId: string, sku: string, quantity: number, variantDetails?: Record<string, string>) => 
    fetchApi<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, sku, quantity, variantDetails })
    }),

  updateItemQuantity: (itemId: string, quantity: number) => 
    fetchApi<Cart>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    }),

  removeItem: (itemId: string) => 
    fetchApi<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE'
    }),

  clearCart: () => 
    fetchApi<Cart>('/cart', {
      method: 'DELETE'
    }),

  applyCoupon: (code: string) => 
    fetchApi<Cart>('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code })
    }),

  removeCoupon: () => 
    fetchApi<Cart>('/cart/coupon', {
      method: 'DELETE'
    }),

  syncCart: (items: { productId: string; sku: string; quantity: number; variantDetails?: Record<string, string> }[]) => 
    fetchApi<Cart>('/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items })
    })
};

// Order API
export const orderApi = {
  createOrder: (data: {
    shippingAddress: Record<string, string>;
    billingAddress?: Record<string, string>;
    paymentMethod: string;
    notes?: string;
  }) => 
    fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getOrders: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    return fetchApi<Order[]>(`/orders?${queryParams.toString()}`);
  },

  getOrder: (id: string) => 
    fetchApi<Order>(`/orders/${id}`),

  getOrderByNumber: (orderNumber: string) => 
    fetchApi<Order>(`/orders/number/${orderNumber}`),

  cancelOrder: (id: string, reason?: string) => 
    fetchApi<Order>(`/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),

  // Admin only
  getAllOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    return fetchApi<Order[]>(`/orders/admin/all?${queryParams.toString()}`);
  },

  updateOrderStatus: (id: string, status: string, description?: string) => 
    fetchApi<Order>(`/orders/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, description })
    }),

  addTracking: (id: string, carrier: string, trackingNumber: string, estimatedDelivery?: string) => 
    fetchApi<Order>(`/orders/admin/${id}/tracking`, {
      method: 'PUT',
      body: JSON.stringify({ carrier, trackingNumber, estimatedDelivery })
    }),

  processRefund: (id: string, amount: number, reason: string) => 
    fetchApi<Order>(`/orders/admin/${id}/refund`, {
      method: 'PUT',
      body: JSON.stringify({ amount, reason })
    })
};

// Review API
export const reviewApi = {
  getProductReviews: (productId: string, params?: { page?: number; limit?: number; rating?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    
    return fetchApi<Review[]>(`/reviews/product/${productId}?${queryParams.toString()}`);
  },

  createReview: (data: {
    productId: string;
    orderId?: string;
    rating: number;
    comment: string;
    title?: string;
    images?: string[];
  }) => 
    fetchApi<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateReview: (id: string, data: Partial<Review>) => 
    fetchApi<Review>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteReview: (id: string) => 
    fetchApi(`/reviews/${id}`, {
      method: 'DELETE'
    }),

  markHelpful: (id: string) => 
    fetchApi(`/reviews/${id}/helpful`, {
      method: 'PUT'
    }),

  getMyReviews: () => 
    fetchApi<Review[]>('/reviews/my/reviews'),

  // Admin only
  getAllReviews: (params?: { page?: number; limit?: number; productId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.productId) queryParams.append('productId', params.productId);
    
    return fetchApi<Review[]>(`/reviews/admin/all?${queryParams.toString()}`);
  },

  toggleReviewStatus: (id: string) => 
    fetchApi(`/reviews/admin/${id}/toggle`, {
      method: 'PUT'
    })
};

// Coupon API
export const couponApi = {
  getCoupons: () => 
    fetchApi<Coupon[]>('/coupons'),

  validateCoupon: (code: string, subtotal: number, productIds?: string[]) => 
    fetchApi('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, productIds })
    }),

  // Admin only
  getAllCoupons: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return fetchApi<Coupon[]>(`/coupons/admin/all?${queryParams.toString()}`);
  },

  createCoupon: (data: Partial<Coupon>) => 
    fetchApi<Coupon>('/coupons/admin', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateCoupon: (id: string, data: Partial<Coupon>) => 
    fetchApi<Coupon>(`/coupons/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteCoupon: (id: string) => 
    fetchApi(`/coupons/admin/${id}`, {
      method: 'DELETE'
    })
};

// Admin API
export const adminApi = {
  getDashboardStats: () => 
    fetchApi<DashboardStats>('/admin/dashboard'),

  getSalesChart: (period?: string) => 
    fetchApi(`/admin/sales-chart?period=${period || 'month'}`),

  getTopProducts: (limit = 10) => 
    fetchApi<Product[]>(`/admin/top-products?limit=${limit}`),

  getTopCustomers: (limit = 10) => 
    fetchApi(`/admin/top-customers?limit=${limit}`),

  getInventoryReport: (threshold = 10) => 
    fetchApi(`/admin/inventory-report?threshold=${threshold}`),

  getRevenueReport: (startDate?: string, endDate?: string) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    return fetchApi(`/admin/revenue-report?${queryParams.toString()}`);
  },

  search: (query: string, type?: string) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (type) queryParams.append('type', type);
    
    return fetchApi(`/admin/search?${queryParams.toString()}`);
  }
};

export default {
  auth: authApi,
  user: userApi,
  product: productApi,
  category: categoryApi,
  cart: cartApi,
  order: orderApi,
  review: reviewApi,
  coupon: couponApi,
  admin: adminApi
};
