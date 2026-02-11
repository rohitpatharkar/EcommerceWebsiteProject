import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  Tag,
  Truck,
  Shield
} from 'lucide-react';
import type { CartItem } from '@/types';
import { formatPrice } from '@/utils/helpers';

// Cart Item Component
function CartItemRow({ item, onUpdateQuantity, onRemove }: { 
  item: CartItem; 
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const product = typeof item.product === 'object' ? item.product : null;
  const imageUrl = product?.images?.find(img => img.isPrimary)?.url || product?.images?.[0]?.url;

  return (
    <div className="flex gap-4 py-4">
      <Link to={`/products/${product?.slug || ''}`} className="w-24 h-24 flex-shrink-0">
        <img
          src={imageUrl || '/placeholder-product.jpg'}
          alt={product?.name || 'Product'}
          className="w-full h-full object-cover rounded-lg"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link to={`/products/${product?.slug || ''}`}>
          <h3 className="font-medium hover:text-primary transition-colors line-clamp-2">
            {product?.name || 'Product'}
          </h3>
        </Link>
        
        {Object.entries(item.variantDetails || {}).length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {Object.entries(item.variantDetails).map(([k, v]) => `${k}: ${v}`).join(', ')}
          </p>
        )}
        
        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
              className="px-3 py-1 hover:bg-muted"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 min-w-[2.5rem] text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
              className="px-3 py-1 hover:bg-muted"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            <button
              onClick={() => onRemove(item._id)}
              className="text-red-500 hover:text-red-700 p-2"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart, updateQuantity, removeItem, applyCoupon, removeCoupon, itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      toast.success('Coupon applied successfully');
      setCouponCode('');
    } catch (error: any) {
      toast.error(error.message || 'Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success('Coupon removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove coupon');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to continue');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link to="/products">
            <Button size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
      <p className="text-muted-foreground mb-8">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {cart.items.map((item, index) => (
                <div key={item._id}>
                  <CartItemRow
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                  {index < cart.items.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Link to="/products">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon */}
              {cart.coupon?.code ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">{cart.coupon.code}</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-700 hover:text-green-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                  >
                    Apply
                  </Button>
                </div>
              )}

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(cart.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Free shipping over $50
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Secure checkout
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
