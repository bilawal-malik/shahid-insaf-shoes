import Product, { primaryImage } from '../models/Product.js';
import Category from '../models/Category.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { getPagination, listResponse } from '../utils/pagination.js';
import { escapeRegex } from '../utils/slug.js';
import * as svc from '../services/adminProductService.js';

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const { q, category, status, sort } = req.query;

  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(String(q)), 'i');
    filter.$or = [{ name: rx }, { slug: rx }, { 'variants.sku': rx }];
  }
  if (category) {
    const all = await Category.find({ isActive: true }).select('_id parent').lean();
    const childrenOf = new Map();
    for (const c of all) {
      const key = c.parent ? c.parent.toString() : 'root';
      if (!childrenOf.has(key)) childrenOf.set(key, []);
      childrenOf.get(key).push(c._id);
    }
    const ids = [];
    const queue = [category];
    while (queue.length) {
      const id = queue.shift();
      ids.push(id);
      for (const child of childrenOf.get(id.toString()) || []) queue.push(child);
    }
    filter.category = { $in: ids };
  }
  if (status && status !== 'all') filter.status = String(status);

  const sortSpec = SORTS[String(sort)] || SORTS.newest;

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .select(
        'name slug price compareAtPrice category images variants status isFeatured isNewArrival createdAt'
      )
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json(
    listResponse(
      docs.map((p) => {
        const primary = primaryImage(p);
        const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);
        return {
          _id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          compareAtPrice: p.compareAtPrice || null,
          category: p.category,
          primaryImage: primary ? { url: primary.url, alt: primary.alt } : null,
          totalStock: activeVariants.reduce((s, v) => s + (v.stock || 0), 0),
          variantCount: (p.variants || []).length,
          status: p.status,
          isFeatured: p.isFeatured,
          isNewArrival: p.isNewArrival,
          createdAt: p.createdAt,
        };
      }),
      page,
      limit,
      total
    )
  );
});

export const detail = asyncHandler(async (req, res) => {
  const product = await svc.findProduct(req.params.id);
  res.json({ product });
});

export const create = asyncHandler(async (req, res) => {
  const product = await svc.createProduct(req.body);
  res.status(201).json({ product });
});

export const update = asyncHandler(async (req, res) => {
  const { product, deactivated } = await svc.updateProduct(req.params.id, req.body);
  res.json({ product: product.toObject({ virtuals: true }), deactivated });
});

export const archive = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: 'archived' },
    { new: true }
  );
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product });
});

export const restore = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'archived')
    throw ApiError.badRequest('Only archived products can be restored');
  product.status = 'draft';
  await product.save();
  res.json({ product });
});

export const quick = asyncHandler(async (req, res) => {
  const set = {};
  for (const [key, value] of Object.entries(req.body || {})) {
    if (value !== undefined) set[key] = value;
  }
  if (!Object.keys(set).length) throw ApiError.badRequest('Nothing to update');

  const product = await Product.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ product });
});
