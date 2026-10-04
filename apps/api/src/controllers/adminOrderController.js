import Order, { ORDER_TRANSITIONS } from '../models/Order.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { getPagination, listResponse } from '../utils/pagination.js';
import { escapeRegex } from '../utils/slug.js';
import { transitionOrder, setInternalNote } from '../services/orderService.js';

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  total_desc: { 'pricing.total': -1 },
};

function dateRange(query) {
  const filter = {};
  if (query.from && !Number.isNaN(new Date(query.from).getTime())) {
    filter.$gte = new Date(query.from);
  }
  if (query.to && !Number.isNaN(new Date(query.to).getTime())) {
    const raw = String(query.to);
    const end = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(`${raw}T23:59:59.999`)
      : new Date(query.to);
    filter.$lte = end;
  }
  return Object.keys(filter).length ? filter : null;
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  const range = dateRange(req.query);
  if (range) filter.createdAt = range;

  const sort = SORTS[req.query.sort] || SORTS.newest;
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(
        'orderNumber status customer pricing.total pricing.shippingCost payment.method items createdAt estimatedDelivery isGuest'
      )
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json(
    listResponse(
      items.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        customer: o.customer,
        total: o.pricing.total,
        itemCount: o.items.reduce((n, i) => n + i.qty, 0),
        paymentMethod: o.payment.method,
        isGuest: o.isGuest,
        createdAt: o.createdAt,
        estimatedDelivery: o.estimatedDelivery,
      })),
      page,
      limit,
      total
    )
  );
});

export const detail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone role')
    .lean();
  if (!order) throw ApiError.notFound('Order not found');
  res.json({
    order: {
      ...order,
      allowedTransitions: ORDER_TRANSITIONS[order.status] || [],
    },
  });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await transitionOrder(req.params.id, req.body, req.user);
  res.json({ order });
});

export const setNote = asyncHandler(async (req, res) => {
  const order = await setInternalNote(req.params.id, req.body.internalNote);
  res.json({ order: { _id: order._id, internalNote: order.internalNote } });
});
