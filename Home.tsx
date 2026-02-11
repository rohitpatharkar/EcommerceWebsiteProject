import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi, categoryApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ShoppingBag, Truck, Shield, Headphones, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, Category } from '@/types';
import { formatPrice, calculateDiscountPercentage } from '@/utils/helpers';

// Hero Section
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="text-sm" variant="secondary">
              New Collection 2024
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Discover Amazing Products at{' '}
              <span className="text-primary">Unbeatable Prices</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Shop from our wide selection of quality products. Free shipping on orders over $50.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Shop Now
                </Button>
              </Link>
              <Link to="/products?featured=true">
                <Button size="lg" variant="outline">
                  View Featured
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
              alt="Shopping"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary fill-primary" />
                </div>
                <div>
                  <p className="font-semibold">50,000+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment methods'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support team'
    },
    {
      icon: ShoppingBag,
      title: 'Easy Returns',
      description: '30-day return policy'
    }
  ];

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
  const discount = product.comparePrice ? calculateDiscountPercentage(product.comparePrice, product.price) : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={primaryImage || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-red-500">
              -{discount}%
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="absolute top-3 right-3" variant="secondary">
              New
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm ml-1">{product.rating?.average?.toFixed(1) || '0.0'}</span>
          </div>
          <span className="text-sm text-muted-foreground">({product.reviewsCount || 0})</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {product.comparePrice > 0 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Featured Products Section
function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productApi.getFeaturedProducts(8);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to load featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Handpicked products just for you</p>
          </div>
          <Link to="/products?featured=true">
            <Button variant="ghost">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Categories Section
function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">Browse our wide range of categories</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="group relative aspect-square rounded-xl overflow-hidden"
              >
                <img
                  src={category.image || '/placeholder-category.jpg'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// New Arrivals Section
function NewArrivalsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productApi.getNewArrivals(4);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to load new arrivals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <p className="text-muted-foreground mt-1">Check out our latest products</p>
          </div>
          <Link to="/products?newArrival=true">
            <Button variant="ghost">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Newsletter Section
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="mb-8 opacity-90">
            Get the latest updates on new products and upcoming sales
          </p>
          
          {isSubmitted ? (
            <div className="bg-primary-foreground/10 rounded-lg p-6">
              <p className="text-lg font-medium">Thank you for subscribing!</p>
              <p className="opacity-80">You will receive our latest updates soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-foreground"
                required
              />
              <Button type="submit" variant="secondary" size="lg">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Main Home Component
export default function Home() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturesSection />
      <FeaturedProductsSection />
      <CategoriesSection />
      <NewArrivalsSection />
      <NewsletterSection />
    </div>
  );
}
