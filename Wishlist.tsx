import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, calculateDiscountPercentage } from '@/utils/helpers';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const response = await userApi.getWishlist();
        setWishlist(response.data);
      } catch (error) {
        console.error('Failed to load wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await userApi.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded mt-2" />
              <div className="h-4 bg-muted rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-6">
            Save items you love to your wishlist and they'll appear here.
          </p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
      <p className="text-muted-foreground mb-8">{wishlist.length} items</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
          const discount = product.comparePrice ? calculateDiscountPercentage(product.comparePrice, product.price) : 0;

          return (
            <Card key={product._id} className="group overflow-hidden">
              <div className="relative aspect-square">
                <Link to={`/products/${product.slug}`}>
                  <img
                    src={primaryImage || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
                <button
                  onClick={() => handleRemove(product._id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              <CardContent className="p-4">
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  {product.comparePrice > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
                <Link to={`/products/${product.slug}`}>
                  <Button size="sm" className="w-full mt-3">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Product
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
