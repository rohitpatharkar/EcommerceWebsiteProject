import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi, categoryApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  X,
  ChevronDown,
  ShoppingCart
} from 'lucide-react';
import type { Product, Category } from '@/types';
import { formatPrice, calculateDiscountPercentage, debounce } from '@/utils/helpers';

// Product Card Component
function ProductCard({ product, viewMode }: { product: Product; viewMode: 'grid' | 'list' }) {
  const primaryImage = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
  const discount = product.comparePrice ? calculateDiscountPercentage(product.comparePrice, product.price) : 0;

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <Link to={`/products/${product.slug}`} className="sm:w-48 flex-shrink-0">
            <div className="relative aspect-square sm:aspect-auto sm:h-full overflow-hidden bg-muted">
              <img
                src={primaryImage || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {discount > 0 && (
                <Badge className="absolute top-3 left-3 bg-red-500">
                  -{discount}%
                </Badge>
              )}
            </div>
          </Link>
          <CardContent className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col h-full justify-between">
              <div>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-lg font-medium hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {product.shortDescription || product.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm ml-1">{product.rating?.average?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviewsCount || 0} reviews)</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{formatPrice(product.price)}</span>
                  {product.comparePrice > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
                <Link to={`/products/${product.slug}`}>
                  <Button>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

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
          {product.totalQuantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
            </div>
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

// Filter Sidebar Component
function FilterSidebar({ 
  categories, 
  brands, 
  priceRange,
  selectedFilters,
  onFilterChange 
}: { 
  categories: Category[];
  brands: string[];
  priceRange: { min: number; max: number };
  selectedFilters: {
    categories: string[];
    brands: string[];
    priceRange: [number, number];
    rating: number | null;
    inStock: boolean;
  };
  onFilterChange: (filters: any) => void;
}) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(selectedFilters.priceRange);

  const handlePriceChange = useCallback(
    debounce((value: [number, number]) => {
      onFilterChange({ ...selectedFilters, priceRange: value });
    }, 300),
    [selectedFilters, onFilterChange]
  );

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category._id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category._id}`}
                checked={selectedFilters.categories.includes(category._id)}
                onCheckedChange={(checked) => {
                  const newCategories = checked
                    ? [...selectedFilters.categories, category._id]
                    : selectedFilters.categories.filter(id => id !== category._id);
                  onFilterChange({ ...selectedFilters, categories: newCategories });
                }}
              />
              <label 
                htmlFor={`cat-${category._id}`}
                className="text-sm cursor-pointer"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <Slider
          value={localPriceRange}
          min={priceRange.min}
          max={priceRange.max}
          step={10}
          onValueChange={(value) => {
            setLocalPriceRange(value as [number, number]);
            handlePriceChange(value as [number, number]);
          }}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{formatPrice(localPriceRange[0])}</span>
          <span>{formatPrice(localPriceRange[1])}</span>
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Brands</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={selectedFilters.brands.includes(brand)}
                  onCheckedChange={(checked) => {
                    const newBrands = checked
                      ? [...selectedFilters.brands, brand]
                      : selectedFilters.brands.filter(b => b !== brand);
                    onFilterChange({ ...selectedFilters, brands: newBrands });
                  }}
                />
                <label 
                  htmlFor={`brand-${brand}`}
                  className="text-sm cursor-pointer"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={selectedFilters.rating === rating}
                onCheckedChange={(checked) => {
                  onFilterChange({ 
                    ...selectedFilters, 
                    rating: checked ? rating : null 
                  });
                }}
              />
              <label 
                htmlFor={`rating-${rating}`}
                className="text-sm cursor-pointer flex items-center"
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                {rating}+ Stars
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="in-stock"
          checked={selectedFilters.inStock}
          onCheckedChange={(checked) => {
            onFilterChange({ ...selectedFilters, inStock: checked as boolean });
          }}
        />
        <label htmlFor="in-stock" className="text-sm cursor-pointer">
          In Stock Only
        </label>
      </div>
    </div>
  );
}

// Main Products Component
export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    priceRange: [0, 1000] as [number, number],
    rating: null as number | null,
    inStock: false
  });

  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Load initial data
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await productApi.getFilters();
        setCategories(response.data.categories);
        setBrands(response.data.brands);
        setPriceRange({
          min: response.data.priceRange.minPrice,
          max: response.data.priceRange.maxPrice
        });
        setFilters(prev => ({
          ...prev,
          priceRange: [response.data.priceRange.minPrice, response.data.priceRange.maxPrice]
        }));
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: 12,
          sort: sortBy
        };

        // URL params
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');
        const newArrival = searchParams.get('newArrival');
        const bestseller = searchParams.get('bestseller');
        const search = searchParams.get('search');

        if (category) params.category = category;
        if (featured === 'true') params.featured = true;
        if (newArrival === 'true') params.newArrival = true;
        if (bestseller === 'true') params.bestseller = true;
        if (search) params.search = search;

        // Filter params
        if (filters.categories.length > 0) params.category = filters.categories[0];
        if (filters.brands.length > 0) params.brand = filters.brands[0];
        if (filters.priceRange[0] > priceRange.min) params.minPrice = filters.priceRange[0];
        if (filters.priceRange[1] < priceRange.max) params.maxPrice = filters.priceRange[1];
        if (filters.rating) params.minRating = filters.rating;
        if (filters.inStock) params.inStock = true;

        const response = await productApi.getProducts(params);
        setProducts(response.data);
        setTotalProducts(response.total || 0);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [searchParams, filters, sortBy, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [priceRange.min, priceRange.max],
      rating: null,
      inStock: false
    });
    setSearchParams(new URLSearchParams());
    setSearchQuery('');
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > priceRange.min ||
    filters.priceRange[1] < priceRange.max ||
    filters.rating !== null ||
    filters.inStock ||
    searchQuery;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Products</h1>
        
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          
          <div className="flex items-center gap-4">
            {/* Mobile Filter Button */}
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar
                    categories={categories}
                    brands={brands}
                    priceRange={priceRange}
                    selectedFilters={filters}
                    onFilterChange={(newFilters) => {
                      setFilters(newFilters);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="bestselling">Bestselling</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden sm:flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.categories.map(catId => {
              const cat = categories.find(c => c._id === catId);
              return cat ? (
                <Badge key={catId} variant="secondary" className="gap-1">
                  {cat.name}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      categories: prev.categories.filter(id => id !== catId)
                    }))}
                  />
                </Badge>
              ) : null;
            })}
            {filters.brands.map(brand => (
              <Badge key={brand} variant="secondary" className="gap-1">
                {brand}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    brands: prev.brands.filter(b => b !== brand)
                  }))}
                />
              </Badge>
            ))}
            {filters.rating && (
              <Badge variant="secondary" className="gap-1">
                {filters.rating}+ Stars
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, rating: null }))}
                />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => {
                    setSearchQuery('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('search');
                    setSearchParams(newParams);
                  }}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Filters</h2>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
            <FilterSidebar
              categories={categories}
              brands={brands}
              priceRange={priceRange}
              selectedFilters={filters}
              onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1);
              }}
            />
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {products.length} of {totalProducts} products
          </div>

          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className={viewMode === 'grid' ? 'aspect-square' : 'h-48'} />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No products found</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalProducts > 12 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {Math.ceil(totalProducts / 12)}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalProducts / 12)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
