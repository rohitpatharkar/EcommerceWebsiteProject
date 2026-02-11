const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get overview analytics
// @route   GET /api/analytics/overview
// @access  Private/Admin
exports.getOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total revenue
  const revenueStats = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['cancelled', 'refunded'] },
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  // New customers
  const newCustomers = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Total customers
  const totalCustomers = await User.countDocuments({ role: 'user' });

  // Conversion rate (orders / total customers * 100)
  const totalOrders = await Order.countDocuments({
    status: { $nin: ['cancelled', 'refunded'] }
  });
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      revenue: revenueStats[0]?.totalRevenue || 0,
      orders: revenueStats[0]?.totalOrders || 0,
      averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
      newCustomers,
      totalCustomers,
      conversionRate
    }
  });
});

// @desc    Get daily sales data
// @route   GET /api/analytics/daily-sales
// @access  Private/Admin
exports.getDailySales = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const dailySales = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['cancelled', 'refunded'] },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        items: { $sum: { $size: '$items' } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: dailySales
  });
});

// @desc    Get category performance
// @route   GET /api/analytics/category-performance
// @access  Private/Admin
exports.getCategoryPerformance = asyncHandler(async (req, res) => {
  const categoryStats = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category._id',
        categoryName: { $first: '$category.name' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' },
        orders: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        categoryName: 1,
        revenue: 1,
        quantity: 1,
        orderCount: { $size: '$orders' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  res.json({
    success: true,
    data: categoryStats
  });
});

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private/Admin
exports.getCustomerAnalytics = asyncHandler(async (req, res) => {
  // Customer acquisition over time
  const customerAcquisition = await User.aggregate([
    { $match: { role: 'user' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Customer segments by order count
  const customerSegments = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' }
      }
    },
    {
      $bucket: {
        groupBy: '$orderCount',
        boundaries: [1, 2, 5, 10, 100],
        default: '10+',
        output: {
          count: { $sum: 1 },
          avgSpent: { $avg: '$totalSpent' }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      acquisition: customerAcquisition,
      segments: customerSegments
    }
  });
});

// @desc    Get product analytics
// @route   GET /api/analytics/products
// @access  Private/Admin
exports.getProductAnalytics = asyncHandler(async (req, res) => {
  // Top selling products
  const topSelling = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  // Low performing products
  const lowPerforming = await Product.find({ isActive: true })
    .sort({ salesCount: 1 })
    .limit(10)
    .select('name salesCount price viewCount');

  res.json({
    success: true,
    data: {
      topSelling,
      lowPerforming
    }
  });
});

// @desc    Get traffic analytics (mock data)
// @route   GET /api/analytics/traffic
// @access  Private/Admin
exports.getTrafficAnalytics = asyncHandler(async (req, res) => {
  // In a real application, this would come from analytics service
  // For now, returning mock data structure
  
  const mockTrafficData = {
    pageViews: {
      total: 15420,
      unique: 8934,
      trend: 12.5
    },
    topPages: [
      { path: '/', views: 5234 },
      { path: '/products', views: 3421 },
      { path: '/product/:id', views: 2890 },
      { path: '/cart', views: 1234 },
      { path: '/checkout', views: 890 }
    ],
    sources: [
      { name: 'Direct', percentage: 35 },
      { name: 'Search', percentage: 28 },
      { name: 'Social', percentage: 22 },
      { name: 'Referral', percentage: 15 }
    ],
    devices: [
      { name: 'Desktop', percentage: 52 },
      { name: 'Mobile', percentage: 41 },
      { name: 'Tablet', percentage: 7 }
    ]
  };

  res.json({
    success: true,
    data: mockTrafficData
  });
});
