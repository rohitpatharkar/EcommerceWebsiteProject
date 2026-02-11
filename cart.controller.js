const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler } = require('../middleware/error.middleware');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name images slug isActive');

  if (!cart) {
    // Create empty cart if doesn't exist
    const newCart = await Cart.create({ user: req.user.id });
    return res.json({
      success: true,
      data: newCart
    });
  }

  res.json({
    success: true,
    data: cart
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addItem = asyncHandler(async (req, res) => {
  const { productId, sku, quantity, variantDetails } = req.body;

  // Find product
  const product = await Product.findById(productId);
  
  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if SKU exists in inventory
  const inventoryItem = product.inventory.find(item => item.sku === sku);
  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Product variant not found'
    });
  }

  // Check stock availability
  if (inventoryItem.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${inventoryItem.quantity} items available in stock`
    });
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  
  if (!cart) {
    cart = new Cart({ user: req.user.id });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId && item.sku === sku
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (inventoryItem.quantity < newQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${inventoryItem.quantity} items available in stock`
      });
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      sku,
      quantity,
      price: product.price,
      variantDetails: variantDetails || {}
    });
  }

  await cart.save();
  
  // Populate and return updated cart
  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Item added to cart',
    data: updatedCart
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
exports.updateItemQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  const cartItem = cart.items.id(itemId);

  if (!cartItem) {
    return res.status(404).json({
      success: false,
      message: 'Cart item not found'
    });
  }

  // Check stock availability
  const product = await Product.findById(cartItem.product);
  const inventoryItem = product.inventory.find(item => item.sku === cartItem.sku);
  
  if (inventoryItem && inventoryItem.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${inventoryItem.quantity} items available in stock`
    });
  }

  if (quantity <= 0) {
    cart.items.pull(itemId);
  } else {
    cartItem.quantity = quantity;
  }

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Cart updated',
    data: updatedCart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items.pull(itemId);
  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: updatedCart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.items = [];
  cart.coupon = { code: null, discount: 0, discountType: 'percentage' };
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: cart
  });
});

// @desc    Apply coupon
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  if (cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot apply coupon to empty cart'
    });
  }

  // Find coupon
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'Invalid coupon code'
    });
  }

  // Validate coupon
  const validation = coupon.isValid();
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.reason
    });
  }

  // Check user usage
  const userCheck = coupon.canUserUse(req.user.id);
  if (!userCheck.canUse) {
    return res.status(400).json({
      success: false,
      message: userCheck.reason
    });
  }

  // Calculate discount
  const productIds = cart.items.map(item => item.product.toString());
  const result = coupon.calculateDiscount(cart.subtotal, productIds);

  if (!result.applicable) {
    return res.status(400).json({
      success: false,
      message: result.reason
    });
  }

  // Apply coupon to cart
  cart.coupon = {
    code: coupon.code,
    discount: coupon.discountValue,
    discountType: coupon.discountType
  };

  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Coupon applied successfully',
    data: {
      cart: updatedCart,
      discount: result.discount
    }
  });
});

// @desc    Remove coupon
// @route   DELETE /api/cart/coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Cart not found'
    });
  }

  cart.coupon = { code: null, discount: 0, discountType: 'percentage' };
  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Coupon removed',
    data: updatedCart
  });
});

// @desc    Sync cart (for logged in users)
// @route   POST /api/cart/sync
// @access  Private
exports.syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id });
  }

  // Validate and sync items
  const validItems = [];
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    
    if (product && product.isActive) {
      const inventoryItem = product.inventory.find(inv => inv.sku === item.sku);
      
      if (inventoryItem && inventoryItem.quantity > 0) {
        const quantity = Math.min(item.quantity, inventoryItem.quantity);
        
        validItems.push({
          product: item.productId,
          sku: item.sku,
          quantity,
          price: product.price,
          variantDetails: item.variantDetails || {}
        });
      }
    }
  }

  cart.items = validItems;
  await cart.save();

  const updatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images slug isActive');

  res.json({
    success: true,
    message: 'Cart synced',
    data: updatedCart
  });
});
