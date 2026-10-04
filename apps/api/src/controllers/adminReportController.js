import Order from '../models/Order.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';

const DEFAULT_DAYS = 30;

function parseRange(query) {
  const now = new Date();
  let from = query.from ? new Date(query.from) : null;
  let to = query.to ? new Date(query.to) : null;
  if (!from || Number.isNaN(from.getTime())) {
    from = new Date(now);
    from.setDate(from.getDate() - (DEFAULT_DAYS - 1));
    from.setHours(0, 0, 0, 0);
  }
  if (!to || Number.isNaN(to.getTime())) {
    to = now;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(query.to))) {
    to = new Date(`${query.to}T23:59:59.999`);
  }
  if (from > to) throw ApiError.badRequest('from must be before to');
  return { from, to };
}

const NOT_REFUNDED = { $nin: ['cancelled', 'returned'] };

export const sales = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req.query);
  const rangeMatch = { createdAt: { $gte: from, $lte: to } };

  const [summaryAgg, byDay, byStatus] = await Promise.all([
    Order.aggregate([
      { $match: { ...rangeMatch, status: NOT_REFUNDED } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
          units: { $sum: { $sum: '$items.qty' } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...rangeMatch, status: NOT_REFUNDED } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
          units: { $sum: { $sum: '$items.qty' } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: rangeMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const s = summaryAgg[0] || { revenue: 0, orders: 0, units: 0 };
  res.json({
    range: { from, to },
    summary: {
      revenue: s.revenue,
      orders: s.orders,
      units: s.units,
      aov: s.orders ? Math.round(s.revenue / s.orders) : 0,
    },
    byDay: byDay.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      orders: d.orders,
      units: d.units,
    })),
    byStatus: Object.fromEntries(byStatus.map((s2) => [s2._id, s2.count])),
  });
});

export const topProducts = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req.query);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

  const items = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: NOT_REFUNDED } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        slug: { $first: '$items.slug' },
        qty: { $sum: '$items.qty' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: limit },
    { $project: { product: '$_id', _id: 0, name: 1, image: 1, slug: 1, qty: 1, revenue: 1 } },
  ]);

  res.json({ items });
});

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const ordersCsv = asyncHandler(async (req, res) => {
  const { from, to } = parseRange(req.query);
  const orders = await Order.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: 1 })
    .select('orderNumber status customer items pricing payment createdAt')
    .lean();

  const header = [
    'Order #',
    'Date',
    'Customer',
    'Phone',
    'Email',
    'Status',
    'Items',
    'Subtotal',
    'Shipping',
    'Total',
    'Payment',
  ];
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      new Date(o.createdAt).toISOString().slice(0, 10),
      o.customer.name,
      o.customer.phone,
      o.customer.email || '',
      o.status,
      o.items.reduce((n, i) => n + i.qty, 0),
      o.pricing.subtotal,
      o.pricing.shippingCost,
      o.pricing.total,
      o.payment.method,
    ]
      .map(csvCell)
      .join(',')
  );

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders-${stamp}.csv"`);
  res.send(`﻿${[header.join(','), ...rows].join('\r\n')}`);
});
