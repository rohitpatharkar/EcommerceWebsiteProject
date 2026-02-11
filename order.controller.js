const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Validate stock availability
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    const inventoryItem = product.inventory.find(inv => inv.sku === item.sku);
    
    if (!inventoryItem || inventoryItem.quantity < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `${product.name} is out of stock or insufficient quantity`
      });
    }
  }

  // Prepare order items
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.product.name,
    sku: item.sku,
    image: item.product.getPrimaryImage(),
    price: item.price,
    quantity: item.quantity,
    variantDetails: item.variantDetails
  }));

  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'pending'
    },
    pricing: {
      subtotal: cart.subtotal,
      discount: cart.discount,
      couponCode: cart.coupon.code,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total
    },
    notes: {
      customer: notes
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Update product stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);
    await product.updateStock(item.sku, item.quantity);
    product.salesCount += item.quantity;
    await product.save();
  }

  // Record coupon usage if applied
  if (cart.coupon.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code });
    if (coupon) {
      await coupon.recordUsage(req.user.id);
    }
  }

  // Clear cart
  await cart.clearCart();

  // Populate and return order
  const populatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: populatedOrder
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = { user: req.user.id };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter)
    .populate('items.product', 'name slug images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('items.product', 'name slug images');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
exports.getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    orderNumber: req.params.orderNumber,
    user: req.user.id
  }).populate('items.product', 'name slug images');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Only allow cancellation for pending or processing orders
  if (!['pending', 'processing'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order with status: ${order.status}`
    });
  }

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const inventoryItem = product.inventory.find(inv => inv.sku === item.sku);
      if (inventoryItem) {
        inventoryItem.quantity += item.quantity;
        product.totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        product.salesCount -= item.quantity;
        await product.save();
      }
    }
  }

  await order.cancel(reason || 'Cancelled by customer', req.user.id);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.paymentStatus) {
    filter['payment.status'] = req.query.paymentStatus;
  }

  if (req.query.startDate && req.query.endDate) {
    filter.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  if (req.query.search) {
    filter.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
      { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: orders
  });
});

// @desc    Get single order (admin)
// @route   GET /api/orders/admin/:id
// @access  Private/Admin
exports.getOrderAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name slug images');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: order
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, description } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.updateStatus(status, description, req.user.id);

  res.json({
    success: true,
    message: 'Order status updated',
    data: order
  });
});

// @desc    Add tracking info (admin)
// @route   PUT /api/orders/admin/:id/tracking
// @access  Private/Admin
exports.addTracking = asyncHandler(async (req, res) => {
  const { carrier, trackingNumber, estimatedDelivery } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  await order.addTracking(carrier, trackingNumber, estimatedDelivery ? new Date(estimatedDelivery) : null);
  
  // Also update status to shipped if pending/processing
  if (['pending', 'processing'].includes(order.status)) {
    await order.updateStatus('shipped', 'Order has been shipped', req.user.id);
  }

  res.json({
    success: true,
    message: 'Tracking information added',
    data: order
  });
});

// @desc    Process refund (admin)
// @route   PUT /api/orders/admin/:id/refund
// @access  Private/Admin
exports.processRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (amount > order.pricing.total) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount cannot exceed order total'
    });
  }

  await order.processRefund(amount, reason);

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: order
  });
});

// @desc    Update payment status (admin/webhook)
// @route   PUT /api/orders/admin/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, transactionId } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  order.payment.status = status;
  
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }
  
  if (status === 'completed') {
    order.payment.paidAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Payment status updated',
    data: order
  });
});
