import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import type { DashboardStats } from '@/types';
import { formatPrice } from '@/utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Today's Sales",
      value: formatPrice(stats.today.sales),
      subtext: `${stats.today.orders} orders`,
      icon: DollarSign,
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Monthly Sales',
      value: formatPrice(stats.month.sales),
      subtext: `${stats.month.orders} orders`,
      icon: ShoppingBag,
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Total Customers',
      value: stats.totals.users.toString(),
      subtext: 'Active users',
      icon: Users,
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Total Products',
      value: stats.totals.products.toString(),
      subtext: 'In stock',
      icon: Package,
      trend: '-2%',
      trendUp: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {stat.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {stats.pendingOrders > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {stats.pendingOrders} pending orders
                </p>
                <p className="text-sm text-yellow-600">
                  Orders waiting to be processed
                </p>
              </div>
            </div>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm">
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {stats.lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="font-medium text-red-800">
                {stats.lowStockProducts.length} products low in stock
              </p>
            </div>
            <div className="space-y-2">
              {stats.lowStockProducts.slice(0, 3).map((product) => (
                <div key={product._id} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">{product.name}</span>
                  <span className="text-red-600">{product.totalQuantity} left</span>
                </div>
              ))}
            </div>
            <Link to="/admin/products" className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                Manage Inventory
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Order</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                  <th className="text-right py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => (
                  <tr key={order._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/admin/orders`}
                        className="font-medium hover:text-primary"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      {typeof order.user === 'object' 
                        ? `${order.user.firstName} ${order.user.lastName}`
                        : 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatPrice(order.pricing?.total || 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
