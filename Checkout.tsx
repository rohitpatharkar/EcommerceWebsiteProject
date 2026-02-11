import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, orderApi, userApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  Package,
  Lock,
  Check
} from 'lucide-react';
import type { Address } from '@/types';
import { formatPrice } from '@/utils/helpers';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await userApi.getProfile();
        setAddresses(response.data.addresses || []);
        const defaultAddr = response.data.addresses?.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr._id || '');
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
      }
    };
    loadAddresses();
  }, []);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !showNewAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    if (showNewAddress) {
      if (!newAddress.firstName || !newAddress.lastName || !newAddress.street || 
          !newAddress.city || !newAddress.state || !newAddress.zipCode) {
        toast.error('Please fill in all address fields');
        return;
      }
    }

    setIsProcessing(true);
    try {
      let shippingAddress;
      
      if (showNewAddress) {
        shippingAddress = newAddress;
      } else {
        const addr = addresses.find(a => a._id === selectedAddress);
        if (addr) {
          shippingAddress = {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            phone: user?.phone || ''
          };
        }
      }

      const response = await orderApi.createOrder({
        shippingAddress: shippingAddress!,
        paymentMethod: paymentMethod as any,
        notes: ''
      });

      toast.success('Order placed successfully!');
      await clearCart();
      navigate(`/order-success/${response.data.orderNumber}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cart || cart.items.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length > 0 && (
                <RadioGroup 
                  value={selectedAddress} 
                  onValueChange={(value) => {
                    setSelectedAddress(value);
                    setShowNewAddress(false);
                  }}
                  className="space-y-4"
                >
                  {addresses.map((addr) => (
                    <div key={addr._id} className="flex items-start space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value={addr._id || ''} id={addr._id} />
                      <Label htmlFor={addr._id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user?.firstName} {user?.lastName}
                          </span>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                        <p className="text-sm text-muted-foreground">{addr.country}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              <div className="mt-4">
                <Button
                  type="button"
                  variant={showNewAddress ? 'default' : 'outline'}
                  onClick={() => {
                    setShowNewAddress(!showNewAddress);
                    setSelectedAddress('');
                  }}
                >
                  {showNewAddress ? 'Cancel' : '+ Add New Address'}
                </Button>
              </div>

              {showNewAddress && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input 
                      value={newAddress.firstName}
                      onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input 
                      value={newAddress.lastName}
                      onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Street Address</Label>
                    <Input 
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input 
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input 
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input 
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer flex items-center gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">P</div>
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-muted-foreground">Pay with your PayPal account</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 border rounded-lg p-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer flex items-center gap-3">
                      <Truck className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    This is a demo. No actual payment will be processed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const product = typeof item.product === 'object' ? item.product : null;
                  return (
                    <div key={item._id} className="flex gap-3">
                      <img
                        src={product?.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={product?.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{product?.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Totals */}
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
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Secure checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
