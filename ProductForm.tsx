import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, categoryApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    comparePrice: '',
    category: '',
    brand: '',
    tags: '',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    images: [{ url: '', alt: '', isPrimary: true }]
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();

    if (isEditing) {
      const loadProduct = async () => {
        try {
          const response = await productApi.getProduct(id);
          const p = response.data;
          setFormData({
            name: p.name,
            description: p.description,
            shortDescription: p.shortDescription || '',
            price: p.price.toString(),
            comparePrice: p.comparePrice?.toString() || '',
            category: typeof p.category === 'object' ? p.category._id : p.category,
            brand: p.brand || '',
            tags: p.tags?.join(', ') || '',
            isActive: p.isActive,
            isFeatured: p.isFeatured,
            isNewArrival: p.isNewArrival,
            images: p.images?.length > 0 ? p.images : [{ url: '', alt: '', isPrimary: true }]
          });
        } catch (error) {
          console.error('Failed to load product:', error);
          toast.error('Product not found');
          navigate('/admin/products');
        }
      };
      loadProduct();
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        inventory: [{ sku: `SKU-${Date.now()}`, quantity: 100, variantCombination: {} }]
      };

      if (isEditing) {
        await productApi.updateProduct(id, data);
        toast.success('Product updated');
      } else {
        await productApi.createProduct(data);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '', isPrimary: false }]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImage = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, [field]: value } : 
        field === 'isPrimary' && value ? { ...img, isPrimary: false } : img
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                required
              />
            </div>
            <div>
              <Label>Short Description</Label>
              <Input
                value={formData.shortDescription}
                onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            <div>
              <Label>Compare Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) => setFormData({...formData, comparePrice: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category *</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border rounded-md px-3 py-2"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Brand</Label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
              />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Image URL"
                    value={img.url}
                    onChange={(e) => updateImage(idx, 'url', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={(e) => updateImage(idx, 'alt', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={img.isPrimary}
                    onCheckedChange={(checked) => updateImage(idx, 'isPrimary', checked as boolean)}
                  />
                  <Label className="text-sm">Primary</Label>
                </div>
                {formData.images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImage(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addImage}>
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked as boolean})}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked as boolean})}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isNewArrival}
                  onCheckedChange={(checked) => setFormData({...formData, isNewArrival: checked as boolean})}
                />
                <Label>New Arrival</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
