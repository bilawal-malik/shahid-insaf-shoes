import mongoose from 'mongoose';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function hydrate(items) {
  const productIds = [...new Set(items.map((i) => String(i.product)))];
  const products = await Product.find({ _id: { $in: productIds }, status: 'active' }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const out = [];
  for (const item of items) {
    const product = byId.get(String(item.product));
    if (!product) continue;
    const variant = (product.variants || []).find((v) => String(v._id) === String(item.variant));
    if (!variant) continue;
    const image = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url || '';
    out.push({
      product: String(product._id),
      variant: String(variant._id),
      name: product.name,
      slug: product.slug,
      image,
      size: variant.size,
      color: variant.color,
      price: variant.priceOverride ?? product.price,
      qty: item.qty,
      stock: variant.stock,
      lineTotal: (variant.priceOverride ?? product.price) * item.qty,
    });
  }
  return out;
}

export const get = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  res.json({ items: await hydrate(cart.items) });
});

export const addItem = asyncHandler(async (req, res) => {
  const { product: productId, variant: variantId, qty } = req.body;

  if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(variantId)) {
    throw ApiError.badRequest('Invalid product or variant');
  }

  const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
  if (!product) throw ApiError.notFound('Product not found');
  const variant = (product.variants || []).find(
    (v) => String(v._id) === String(variantId) && v.isActive !== false
  );
  if (!variant) throw ApiError.notFound('Variant not found');

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((i) => String(i.variant) === String(variantId));
  const newQty = (existing?.qty || 0) + qty;

  if (newQty > variant.stock) {
    throw ApiError.conflict('Not enough stock available', 'STOCK_UNAVAILABLE', {
      conflicts: [{ variant: String(variantId), available: variant.stock }],
    });
  }

  if (existing) existing.qty = newQty;
  else cart.items.push({ product: productId, variant: variantId, qty });
  await cart.save();

  res.status(201).json({ items: await hydrate(cart.items) });
});

export const updateItem = asyncHandler(async (req, res) => {
  const { variant: variantId } = req.params;
  const { qty } = req.body;

  const cart = await loadCart(req.user._id);
  const item = cart.items.find((i) => String(i.variant) === String(variantId));
  if (!item) throw ApiError.notFound('Item not in cart');

  if (qty <= 0) {
    cart.items = cart.items.filter((i) => String(i.variant) !== String(variantId));
    await cart.save();
    return res.json({ items: await hydrate(cart.items) });
  }

  const product = await Product.findById(item.product).lean();
  const variant = product?.variants?.find((v) => String(v._id) === String(variantId));
  if (!variant || qty > variant.stock) {
    throw ApiError.conflict('Not enough stock available', 'STOCK_UNAVAILABLE', {
      conflicts: [{ variant: String(variantId), available: variant?.stock || 0 }],
    });
  }

  item.qty = qty;
  await cart.save();
  return res.json({ items: await hydrate(cart.items) });
});

export const removeItem = asyncHandler(async (req, res) => {
  const { variant: variantId } = req.params;
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.variant) !== String(variantId));
  await cart.save();
  res.json({ items: await hydrate(cart.items) });
});

export const clear = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.json({ items: [] });
});
