import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { getPagination, listResponse } from '../utils/pagination.js';
import { escapeRegex } from '../utils/slug.js';

const NOT_REFUNDED = ['cancelled', 'returned'];

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const match = { role: 'customer' };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user',
        as: 'orders',
      },
    },
    {
      $addFields: {
        orderCount: { $size: '$orders' },
        totalSpent: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$orders',
                  cond: { $in: ['$$this.status', NOT_REFUNDED] },
                },
              },
              in: '$$this.pricing.total',
            },
          },
        },
        lastOrderAt: { $max: '$orders.createdAt' },
      },
    },
    { $project: { password: 0, resetOtpHash: 0, resetTokenHash: 0, resetExpiresAt: 0, orders: 0 } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const countPipeline = [{ $match: match }, { $count: 'total' }];

  const [items, countRes] = await Promise.all([
    User.aggregate(pipeline),
    User.aggregate(countPipeline),
  ]);

  res.json(listResponse(items, page, limit, countRes[0]?.total || 0));
});

export const detail = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Customer not found');
  const customer = await User.findById(req.params.id)
    .select('-resetOtpHash -resetTokenHash -resetExpiresAt')
    .lean();
  if (!customer || customer.role !== 'customer') throw ApiError.notFound('Customer not found');

  const orders = await Order.find({ user: customer._id })
    .sort({ createdAt: -1 })
    .select('orderNumber status pricing.total items createdAt payment.method')
    .lean();

  res.json({
    customer: {
      ...customer,
      orderCount: orders.length,
      totalSpent: orders
        .filter((o) => !['cancelled', 'returned'].includes(o.status))
        .reduce((sum, o) => sum + o.pricing.total, 0),
    },
    orders: orders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.pricing.total,
      itemCount: o.items.reduce((n, i) => n + i.qty, 0),
      paymentMethod: o.payment.method,
      createdAt: o.createdAt,
    })),
  });
});

export const update = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Customer not found');
  if (String(req.user._id) === req.params.id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  const customer = await User.findById(req.params.id);
  if (!customer || customer.role !== 'customer') throw ApiError.notFound('Customer not found');

  customer.isActive = !!req.body.isActive;
  await customer.save();
  res.json({ customer: { _id: customer._id, isActive: customer.isActive } });
});
