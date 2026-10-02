import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { getConfig } from './configService.js';
import { nextOrderNumber } from './counterService.js';
import { registerCustomer } from './authService.js';
import { ApiError } from '../utils/apiError.js';

/** Normalizes PK phone variants (03..., +923..., 923...) to 03... */
export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length === 12) digits = `0${digits.slice(2)}`;
  return digits;
}

function stockConflict(conflicts) {
  return ApiError.conflict(
    'Some items are no longer available in the requested quantity',
    'STOCK_UNAVAILABLE',
    { conflicts }
  );
}

function estimateDelivery(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now;
}

/**
 * Places a COD order:
 * server-side price recompute, atomic conditional stock decrement (with
 * rollback), snapshot items/customer/address, order number, optional account.
 */
export async function createOrder({ customer, shippingAddress, items, createAccount }, user) {
  const accountEmail = createAccount?.password ? customer.email?.trim() : null;
  if (createAccount?.password && !accountEmail) {
    throw ApiError.badRequest('Email is required to create an account', {
      'customer.email': 'Email is required to create an account',
    });
  }
  if (accountEmail && (await User.exists({ email: accountEmail }))) {
    throw ApiError.badRequest('An account with this email already exists — sign in instead', {
      'customer.email': 'An account with this email already exists',
    });
  }

  // Merge duplicate variant lines defensively
  const merged = new Map();
  for (const item of items) {
    const key = `${item.product}:${item.variant}`;
    const existing = merged.get(key);
    if (existing) existing.qty += item.qty;
    else merged.set(key, { ...item });
  }
  const requestItems = [...merged.values()];

  const productIds = [...new Set(requestItems.map((i) => String(i.product)))];
  const invalid = productIds.filter((id) => !mongoose.isValidObjectId(id));
  if (invalid.length) throw ApiError.badRequest('Invalid product in items');

  const products = await Product.find({ _id: { $in: productIds }, status: 'active' }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const conflicts = [];
  const lines = [];

  for (const item of requestItems) {
    const product = byId.get(String(item.product));
    if (!product) {
      conflicts.push({ variant: item.variant, available: 0, name: 'Unknown product' });
      continue;
    }
    const variant = (product.variants || []).find(
      (v) => String(v._id) === String(item.variant) && v.isActive !== false
    );
    if (!variant) {
      conflicts.push({ variant: item.variant, available: 0, name: product.name });
      continue;
    }
    if ((variant.stock || 0) < item.qty) {
      conflicts.push({
        variant: item.variant,
        available: variant.stock || 0,
        name: product.name,
        size: variant.size,
        color: variant.color,
      });
      continue;
    }
    const price = variant.priceOverride ?? product.price;
    const image = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url || '';
    lines.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image,
      size: variant.size,
      color: variant.color,
      sku: variant.sku || '',
      price,
      qty: item.qty,
      lineTotal: price * item.qty,
      _productId: product._id,
      _variantId: variant._id,
    });
  }

  if (conflicts.length) throw stockConflict(conflicts);

  // Atomic conditional decrement — one query per line, rollback on partial failure
  const decremented = [];
  for (const line of lines) {
    const result = await Product.updateOne(
      {
        _id: line._productId,
        variants: { $elemMatch: { _id: line._variantId, stock: { $gte: line.qty } } },
      },
      { $inc: { 'variants.$.stock': -line.qty } }
    );

    if (result.modifiedCount === 0) {
      for (const done of decremented) {
        await Product.updateOne(
          { _id: done.productId, 'variants._id': done.variantId },
          { $inc: { 'variants.$.stock': done.qty } }
        );
      }
      const fresh = await Product.findById(line._productId).lean();
      const v = fresh?.variants?.find((x) => String(x._id) === String(line._variantId));
      throw stockConflict([
        {
          variant: String(line._variantId),
          available: v?.stock || 0,
          name: line.name,
          size: line.size,
          color: line.color,
        },
      ]);
    }
    decremented.push({ productId: line._productId, variantId: line._variantId, qty: line.qty });
  }

  try {
    const cfg = await getConfig();
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const freeShipping = cfg.shipping.freeAbove > 0 && subtotal >= cfg.shipping.freeAbove;
    const shippingCost = freeShipping ? 0 : cfg.shipping.flatRate || 0;
    const total = subtotal + shippingCost;

    const days = String(cfg.shipping.estimatedDays || '3-5')
      .split('-')
      .map((n) => Number.parseInt(n, 10))
      .filter((n) => Number.isFinite(n));
    const maxDays = days.length ? Math.max(...days) : 5;

    const orderNumber = await nextOrderNumber();
    const phone = normalizePhone(shippingAddress.phone);

    const order = await Order.create({
      orderNumber,
      user: user?._id || null,
      isGuest: !user,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
      },
      shippingAddress: { ...shippingAddress, phone },
      items: lines.map(({ _productId, _variantId, ...line }) => line),
      pricing: { subtotal, shippingCost, discount: 0, total },
      payment: { method: 'cod', status: 'pending' },
      status: 'placed',
      statusHistory: [{ status: 'placed', note: 'Order placed — Cash on Delivery' }],
      estimatedDelivery: estimateDelivery(maxDays),
    });

    await Product.bulkWrite(
      lines.map((l) => ({
        updateOne: { filter: { _id: l._productId }, update: { $inc: { soldCount: l.qty } } },
      }))
    );

    let accountCreated = false;
    if (accountEmail && createAccount?.password) {
      try {
        await registerCustomer({
          name: customer.name,
          email: accountEmail,
          phone: customer.phone,
          password: createAccount.password,
        });
        accountCreated = true;
      } catch (err) {
        console.error('[orders] account creation failed after order:', err.message);
      }
    }

    return { order, accountCreated };
  } catch (err) {
    // Roll back stock if order persistence failed after decrementing
    if (err?.name !== 'ApiError') {
      for (const done of decremented) {
        await Product.updateOne(
          { _id: done.productId, 'variants._id': done.variantId },
          { $inc: { 'variants.$.stock': done.qty } }
        ).catch(() => {});
      }
    }
    throw err;
  }
}

export async function lookupOrder(orderNumber, phone) {
  const normalized = normalizePhone(phone);
  const order = await Order.findOne({
    orderNumber,
    $or: [{ 'customer.phone': normalized }, { 'shippingAddress.phone': normalized }],
  })
    .select(
      'orderNumber status statusHistory estimatedDelivery createdAt items pricing payment.method'
    )
    .lean();

  if (!order) throw ApiError.notFound('No order found with those details');

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusHistory: (order.statusHistory || []).map((h) => ({
      status: h.status,
      note: h.note,
      at: h.at,
    })),
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
    paymentMethod: order.payment?.method,
    pricing: order.pricing,
    items: (order.items || []).map((i) => ({
      name: i.name,
      image: i.image,
      size: i.size,
      color: i.color,
      qty: i.qty,
      lineTotal: i.lineTotal,
    })),
  };
}
