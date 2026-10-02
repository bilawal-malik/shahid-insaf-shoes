import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

/** Server-enforced transition map (docs/01 §5) */
export const ORDER_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

const customerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String },
    size: { type: String, required: true },
    color: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ORDER_STATUSES },
    note: { type: String },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isGuest: { type: Boolean, default: true },

    customer: { type: customerSnapshotSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    items: { type: [itemSchema], required: true, validate: (v) => v.length > 0 },

    pricing: {
      subtotal: { type: Number, required: true },
      shippingCost: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },

    payment: {
      method: { type: String, enum: ['cod'], default: 'cod' },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      transactionId: { type: String },
      paidAt: Date,
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: [statusHistorySchema],

    internalNote: { type: String },
    estimatedDelivery: Date,
    cancelledAt: Date,
    cancelReason: String,

    stockAdjusted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
