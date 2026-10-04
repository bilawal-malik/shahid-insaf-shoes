import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/apiError.js';
import { getConfig } from '../services/configService.js';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

export const dashboard = asyncHandler(async (_req, res) => {
  const today = startOfDay();
  const range = (from) => ({ $match: { createdAt: { $gte: from }, status: { $ne: 'cancelled' } } });

  const [todayAgg, d7, d30, pendingOrders, salesChart, recentOrders, products, config] =
    await Promise.all([
      Order.aggregate([
        range(today),
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        range(daysAgo(7)),
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        range(daysAgo(30)),
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
      ]),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: daysAgo(13) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$pricing.total'] },
            },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status pricing.total customer.name createdAt items')
        .lean(),
      Product.find({ status: { $ne: 'archived' } })
        .select('name slug images variants')
        .lean(),
      getConfig().catch(() => null),
    ]);

  const t = todayAgg[0] || { revenue: 0, orders: 0 };
  const s7 = d7[0] || { revenue: 0, orders: 0 };
  const s30 = d30[0] || { revenue: 0, orders: 0 };

  const lowStockThreshold = config?.checkout?.lowStockThreshold ?? 5;
  const lowStock = [];
  for (const p of products) {
    for (const v of p.variants || []) {
      if (v.isActive !== false && v.stock <= lowStockThreshold) {
        lowStock.push({
          product: { _id: p._id, name: p.name, slug: p.slug },
          variant: { _id: v._id, size: v.size, color: v.color },
          stock: v.stock,
        });
      }
    }
  }
  lowStock.sort((a, b) => a.stock - b.stock);

  res.json({
    kpi: {
      revenueToday: t.revenue,
      revenue7d: s7.revenue,
      revenue30d: s30.revenue,
      ordersToday: t.orders,
      orders7d: s7.orders,
      orders30d: s30.orders,
      aov: s30.orders ? Math.round(s30.revenue / s30.orders) : 0,
      pendingOrders,
      lowStockCount: lowStock.length,
    },
    salesChart: salesChart.map((s) => ({ date: s._id, revenue: s.revenue, orders: s.orders })),
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.pricing.total,
      customerName: o.customer.name,
      itemCount: o.items.reduce((n, i) => n + i.qty, 0),
      createdAt: o.createdAt,
    })),
    lowStock: lowStock.slice(0, 20),
    lowStockThreshold,
  });
});
