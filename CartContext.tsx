import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cartApi } from '@/services/api';
import type { Cart, CartItem } from '@/types';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, sku: string, quantity: number, variantDetails?: Record<string, string>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage for guests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshCart();
    } else {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, []);

  // Save cart to localStorage when it changes (for guests)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && cart) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }, [cart]);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const response = await cartApi.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, sku: string, quantity: number, variantDetails?: Record<string, string>) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Logged in user - use API
      const response = await cartApi.addItem(productId, sku, quantity, variantDetails);
      setCart(response.data);
    } else {
      // Guest user - use localStorage
      const savedCart = localStorage.getItem('guestCart');
      let guestCart: Cart = savedCart ? JSON.parse(savedCart) : {
        _id: 'guest',
        user: 'guest',
        items: [],
        coupon: { code: null, discount: 0, discountType: 'percentage' },
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        currency: 'USD'
      };

      // Find existing item
      const existingItemIndex = guestCart.items.findIndex(
        item => item.product === productId && item.sku === sku
      );

      if (existingItemIndex > -1) {
        guestCart.items[existingItemIndex].quantity += quantity;
      } else {
        guestCart.items.push({
          _id: Date.now().toString(),
          product: productId,
          sku,
          quantity,
          price: 0, // Will be set when product is fetched
          variantDetails: variantDetails || {},
          addedAt: new Date().toISOString()
        });
      }

      // Recalculate totals
      calculateCartTotals(guestCart);
      setCart(guestCart);
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const response = await cartApi.updateItemQuantity(itemId, quantity);
      setCart(response.data);
    } else {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const guestCart: Cart = JSON.parse(savedCart);
        const itemIndex = guestCart.items.findIndex(item => item._id === itemId);
        
        if (itemIndex > -1) {
          if (quantity <= 0) {
            guestCart.items.splice(itemIndex, 1);
          } else {
            guestCart.items[itemIndex].quantity = quantity;
          }
          
          calculateCartTotals(guestCart);
          setCart(guestCart);
          localStorage.setItem('guestCart', JSON.stringify(guestCart));
        }
      }
    }
  };

  const removeItem = async (itemId: string) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const response = await cartApi.removeItem(itemId);
      setCart(response.data);
    } else {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const guestCart: Cart = JSON.parse(savedCart);
        guestCart.items = guestCart.items.filter(item => item._id !== itemId);
        
        calculateCartTotals(guestCart);
        setCart(guestCart);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
      }
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      const response = await cartApi.clearCart();
      setCart(response.data);
    } else {
      localStorage.removeItem('guestCart');
      setCart(null);
    }
  };

  const applyCoupon = async (code: string) => {
    const response = await cartApi.applyCoupon(code);
    setCart(response.data);
  };

  const removeCoupon = async () => {
    const response = await cartApi.removeCoupon();
    setCart(response.data);
  };

  const calculateCartTotals = (cart: Cart) => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 0; // Calculate based on coupon
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal - discount + tax + shipping;

    cart.subtotal = subtotal;
    cart.discount = discount;
    cart.tax = tax;
    cart.shipping = shipping;
    cart.total = total;
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const value: CartContextType = {
    cart,
    itemCount,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
