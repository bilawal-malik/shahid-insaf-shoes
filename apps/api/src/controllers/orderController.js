import { asyncHandler, ApiError } from '../utils/apiError.js';
import * as orderService from '../services/orderService.js';
import Order from '../models/Order.js';
import { getPagination, listResponse } from '../utils/pagination.js';

export const create = asyncHandler(async (req, res) => {
  const { order, accountCreated } = await orderService.createOrder(req.body, req.user || null);
  res.status(201).json({ order, accountCreated });
});

export const lookup = asyncHandler(async (req, res) => {
  const { orderNumber, phone } = req.query;
  const order = await orderService.lookupOrder(orderNumber, phone);
  res.json({ order });
});

export const mine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 10, maxLimit: 30 });
  const filter = { user: req.user._id };
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json(
    listResponse(
      docs.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        pricing: o.pricing,
        itemCount: o.items.reduce((n, i) => n + i.qty, 0),
        estimatedDelivery: o.estimatedDelivery,
      })),
      page,
      limit,
      total
    )
  );
});

export const detail = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ order });
});
