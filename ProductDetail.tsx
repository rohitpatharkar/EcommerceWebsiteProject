import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi, reviewApi, cartApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Product, Review } from '@/types';
import { formatPrice, calculateDiscountPercentage } from '@/utils/helpers';

// Review Component
function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="border-b pb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="font-medium text-sm">
                {typeof review.user === 'object' 
                  ? `${review.user.firstName?.[0]}${review.user.lastName?.[0]}`
                  : 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium">
                {typeof review.user === 'object' 
                  ? `${review.user.firstName} ${review.user.lastName}`
                  : 'User'}
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
          {review.verifiedPurchase && (
            <Badge variant="secondary" className="mt-2 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Verified Purchase
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.title && (
        <h4 className="font-medium mt-3">{review.title}</h4>
      )}
      <p className="text-muted-foreground mt-2">{review.comment}</p>
      {review.adminResponse && (
        <div className="mt-4 bg-muted p-4 rounded-lg">
          <p className="text-sm font-medium text-primary">Response from Store</p>
          <p className="text-sm text-muted-foreground mt-1">{review.adminResponse.comment}</p>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedSku, setSelectedSku] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const [productRes, reviewsRes, relatedRes] = await Promise.all([
          productApi.getProductBySlug(slug),
          reviewApi.getProductReviews(slug),
          productApi.getRelatedProducts(slug)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        setRelatedProducts(relatedRes.data);
        
        // Initialize variant selections
        if (productRes.data.variants?.length > 0) {
          const initialVariants: Record<string, string> = {};
          productRes.data.variants.forEach(v => {
            initialVariants[v.name] = v.options[0];
          });
          setSelectedVariants(initialVariants);
          
          // Find matching SKU
          findMatchingSku(initialVariants, productRes.data);
        } else if (productRes.data.inventory?.length > 0) {
          setSelectedSku(productRes.data.inventory[0].sku);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProduct();
  }, [slug, navigate]);

  const findMatchingSku = (variants: Record<string, string>, prod: Product) => {
    const match = prod.inventory.find(inv => {
      const combo = inv.variantCombination;
      return Object.entries(variants).every(([key, value]) => combo[key] === value);
    });
    
    if (match) {
      setSelectedSku(match.sku);
    }
  };

  const handleVariantChange = (variantName: string, value: string) => {
    const newVariants = { ...selectedVariants, [variantName]: value };
    setSelectedVariants(newVariants);
    if (product) {
      findMatchingSku(newVariants, product);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product._id, selectedSku, quantity, selectedVariants);
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getInventoryQuantity = () => {
    if (!product) return 0;
    const item = product.inventory.find(inv => inv.sku === selectedSku);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24" />
            <Skeleton className="h-12 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
  const discount = product.comparePrice ? calculateDiscountPercentage(product.comparePrice, product.price) : 0;
  const inventoryQty = getInventoryQuantity();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link>
        {' / '}
        <Link to="/products" className="hover:text-primary">Products</Link>
        {' / '}
        {typeof product.category === 'object' && (
          <>
            <Link to={`/products?category=${product.category._id}`} className="hover:text-primary">
              {product.category.name}
            </Link>
            {' / '}
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.images?.[selectedImage]?.url || primaryImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-red-500 text-lg px-3 py-1">
                -{discount}%
              </Badge>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="ml-1 font-medium">{product.rating?.average?.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({product.reviewsCount} reviews)</span>
              {product.brand && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground">Brand: {product.brand}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.comparePrice > 0 && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <p className="text-muted-foreground">{product.shortDescription || product.description}</p>

          {/* Variants */}
          {product.variants?.map((variant) => (
            <div key={variant.name}>
              <label className="font-medium mb-2 block">
                {variant.name}: {selectedVariants[variant.name]}
              </label>
              <div className="flex gap-2 flex-wrap">
                {variant.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleVariantChange(variant.name, option)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      selectedVariants[variant.name] === option
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <label className="font-medium mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-muted"
                >
                  -
                </button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(inventoryQty, quantity + 1))}
                  className="px-4 py-2 hover:bg-muted"
                  disabled={quantity >= inventoryQty}
                >
                  +
                </button>
              </div>
              <span className={`text-sm ${inventoryQty < 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {inventoryQty > 0 ? `${inventoryQty} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="flex-1"
              onClick={handleAddToCart}
              disabled={inventoryQty === 0 || isAddingToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y">
            <div className="text-center">
              <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">Orders $50+</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-muted-foreground">100% Protected</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Easy Returns</p>
              <p className="text-xs text-muted-foreground">30 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({product.reviewsCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="prose max-w-none">
              <p>{product.description}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {product.brand && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
              )}
              {product.weight?.value > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{product.weight.value} {product.weight.unit}</span>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Tags</span>
                  <span className="font-medium">{product.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewItem key={review._id} review={review} />
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                )}
              </div>
              <div>
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="font-semibold mb-4">Rating Overview</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-bold">{product.rating?.average?.toFixed(1)}</span>
                    <div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${i < Math.round(product.rating?.average || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{product.reviewsCount} reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((prod) => (
              <Link key={prod._id} to={`/products/${prod.slug}`}>
                <div className="group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3">
                    <img
                      src={prod.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-lg font-bold mt-1">{formatPrice(prod.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
