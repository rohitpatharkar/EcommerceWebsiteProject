const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Today's stats
  const todayOrders = await Order.find({
    createdAt: { $gte: startOfDay },
    status: { $nin: ['cancelled', 'refunded'] }
  });

  const todaySales = todayOrders.reduce((sum, order) => sum + order.pricing.total, 0);

  // Monthly stats
  const monthOrders = await Order.find({
    createdAt: { $gte: startOfMonth },
    status: { $nin: ['cancelled', 'refunded'] }
  });

  const monthSales = monthOrders.reduce((sum, order) => sum + order.pricing.total, 0);

  // Yearly stats
  const yearOrders = await Order.find({
    createdAt: { $gte: startOfYear },
    status: { $nin: ['cancelled', 'refunded'] }
  });

  const yearSales = yearOrders.reduce((sum, order) => sum + order.pricing.total, 0);

  // Total counts
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments({ isActive: true });
  const totalOrders = await Order.countDocuments({ status: { $nin: ['cancelled', 'refunded'] } });
  const totalCategories = await Category.countDocuments({ isActive: true });

  // Pending orders
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // Low stock products
  const lowStockProducts = await Product.find({
    isActive: true,
    $expr: { $lte: ['$totalQuantity', 10] }
  }).limit(5).select('name totalQuantity inventory');

  // Recent orders
  const recentOrders = await Order.find()
    .populate('user', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber status pricing.total createdAt');

  // Sales by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      today: {
        orders: todayOrders.length,
        sales: todaySales
      },
      month: {
        orders: monthOrders.length,
        sales: monthSales
      },
      year: {
        orders: yearOrders.length,
        sales: yearSales
      },
      totals: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        categories: totalCategories
      },
      pendingOrders,
      lowStockProducts,
      recentOrders,
      ordersByStatus
    }
  });
});

// @desc    Get sales chart data
// @route   GET /api/admin/sales-chart
// @access  Private/Admin
exports.getSalesChart = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let groupBy, format;
  const now = new Date();
  let startDate;

  if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    format = 'daily';
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    format = 'daily';
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    format = 'monthly';
  } else {
    startDate = new Date(now.getFullYear() - 5, 0, 1);
    groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } };
    format = 'yearly';
  }

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled', 'refunded'] }
      }
    },
    {
      $group: {
        _id: groupBy,
        sales: { $sum: '$pricing.total' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      format,
      sales: salesData
    }
  });
});

// @desc    Get top products
// @route   GET /api/admin/top-products
// @access  Private/Admin
exports.getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const topProducts = await Product.find({ isActive: true })
    .sort({ salesCount: -1 })
    .limit(limit)
    .select('name salesCount price rating.average images');

  res.json({
    success: true,
    data: topProducts
  });
});

// @desc    Get top customers
// @route   GET /api/admin/top-customers
// @access  Private/Admin
exports.getTopCustomers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;

  const topCustomers = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        email: '$user.email',
        totalOrders: 1,
        totalSpent: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: topCustomers
  });
});

// @desc    Get inventory report
// @route   GET /api/admin/inventory-report
// @access  Private/Admin
exports.getInventoryReport = asyncHandler(async (req, res) => {
  const lowStockThreshold = parseInt(req.query.threshold, 10) || 10;

  const totalProducts = await Product.countDocuments({ isActive: true });
  
  const lowStockCount = await Product.countDocuments({
    isActive: true,
    totalQuantity: { $lte: lowStockThreshold, $gt: 0 }
  });

  const outOfStockCount = await Product.countDocuments({
    isActive: true,
    totalQuantity: 0
  });

  const lowStockProducts = await Product.find({
    isActive: true,
    totalQuantity: { $lte: lowStockThreshold, $gt: 0 }
  })
    .select('name totalQuantity inventory sku')
    .limit(20);

  const outOfStockProducts = await Product.find({
    isActive: true,
    totalQuantity: 0
  })
    .select('name totalQuantity inventory')
    .limit(20);

  res.json({
    success: true,
    data: {
      summary: {
        totalProducts,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      },
      lowStockProducts,
      outOfStockProducts
    }
  });
});

// @desc    Get revenue report
// @route   GET /api/admin/revenue-report
// @access  Private/Admin
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = {
    status: { $nin: ['cancelled', 'refunded'] }
  };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const revenueData = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        totalSubtotal: { $sum: '$pricing.subtotal' },
        totalDiscount: { $sum: '$pricing.discount' },
        totalTax: { $sum: '$pricing.tax' },
        totalShipping: { $sum: '$pricing.shipping' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' }
      }
    }
  ]);

  const revenueByPaymentMethod = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$payment.method',
        revenue: { $sum: '$pricing.total' },
        count: { $sum: 1 }
      }
    }
  ]);

  const revenueByStatus = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        revenue: { $sum: '$pricing.total' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: revenueData[0] || {},
      byPaymentMethod: revenueByPaymentMethod,
      byStatus: revenueByStatus
    }
  });
});

// @desc    Search admin data
// @route   GET /api/admin/search
// @access  Private/Admin
exports.search = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const results = {};

  if (!type || type === 'products') {
    results.products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .select('name price images slug');
  }

  if (!type || type === 'orders') {
    results.orders = await Order.find({
      $or: [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: q, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: q, $options: 'i' } }
      ]
    })
      .populate('user', 'firstName lastName email')
      .limit(10)
      .select('orderNumber status pricing.total createdAt');
  }

  if (!type || type === 'users') {
    results.users = await User.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .select('firstName lastName email role isActive');
  }

  res.json({
    success: true,
    data: results
  });
});
