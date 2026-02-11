import { useEffect, useState } from 'react';
import { couponApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Coupon } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumPurchase: '',
    endDate: ''
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await couponApi.getAllCoupons();
      setCoupons(response.data);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await couponApi.createCoupon({
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumPurchase: parseFloat(formData.minimumPurchase) || 0,
        startDate: new Date().toISOString(),
        usageLimit: { total: null, perUser: null }
      });
      toast.success('Coupon created');
      setShowForm(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minimumPurchase: '',
        endDate: ''
      });
      loadCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await couponApi.deleteCoupon(id);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                required
              />
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                className="border rounded-md px-3 py-2"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <Input
                type="number"
                placeholder={formData.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                value={formData.discountValue}
                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                required
              />
              <Input
                type="number"
                placeholder="Minimum Purchase"
                value={formData.minimumPurchase}
                onChange={(e) => setFormData({...formData, minimumPurchase: e.target.value})}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
              <div className="col-span-3 flex gap-2">
                <Button type="submit">Create</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-left py-3 px-4">Discount</th>
                <th className="text-left py-3 px-4">Usage</th>
                <th className="text-left py-3 px-4">Expires</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium">{coupon.code}</span>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%` 
                      : `$${coupon.discountValue}`}
                    {coupon.minimumPurchase > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Min: ${coupon.minimumPurchase}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {coupon.usageCount} / {coupon.usageLimit?.total || '∞'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={new Date(coupon.endDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {formatDate(coupon.endDate)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon._id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
