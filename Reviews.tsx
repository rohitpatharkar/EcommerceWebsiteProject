import { useEffect, useState } from 'react';
import { reviewApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Star, Eye, EyeOff } from 'lucide-react';
import type { Review } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await reviewApi.getAllReviews();
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await reviewApi.toggleReviewStatus(id);
      toast.success('Review status updated');
      loadReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Rating</th>
                <th className="text-left py-3 px-4">Review</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    {typeof review.product === 'object' ? review.product.name : 'Product'}
                  </td>
                  <td className="py-3 px-4">
                    {typeof review.user === 'object' 
                      ? `${review.user.firstName} ${review.user.lastName}` 
                      : 'User'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="truncate">{review.comment}</p>
                    {review.title && <p className="text-sm font-medium">{review.title}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={review.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {review.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(review._id)}
                    >
                      {review.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
