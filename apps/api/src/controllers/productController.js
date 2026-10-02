import Product, { primaryImage } from '../models/Product.js';
import Category from '../models/Category.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/apiError.js';
import { getPagination, listResponse } from '../utils/pagination.js';
import { escapeRegex } from '../utils/slug.js';

const LIST_FIELDS =
  'name slug price compareAtPrice category images variants isFeatured isNewArrival soldCount createdAt';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { soldCount: -1, createdAt: -1 },
};

export function toListItem(p) {
  const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);
  const totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
  const primary = primaryImage(p);
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || null,
    category: p.category,
    primaryImage: primary ? { url: primary.url, alt: primary.alt } : null,
    totalStock,
    sizes: [...new Set(activeVariants.map((v) => v.size))],
    colors: [...new Set(activeVariants.map((v) => v.color))],
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    soldCount: p.soldCount,
    discountPercent:
      p.compareAtPrice && p.compareAtPrice > p.price
        ? Math.round((1 - p.price / p.compareAtPrice) * 100)
        : 0,
    createdAt: p.createdAt,
  };
}

async function buildFilter(query) {
  const filter = { status: 'active' };

  if (query.category) {
    const cat = await Category.findOne({ slug: query.category, isActive: true }).select('_id');
    filter.category = cat ? cat._id : null;
  }

  if (query.featured === 'true') filter.isFeatured = true;
  if (query.newArrival === 'true') filter.isNewArrival = true;

  if (query.size || query.color) {
    filter.variants = { $elemMatch: {} };
    if (query.size) filter.variants.$elemMatch.size = String(query.size);
    if (query.color) {
      filter.variants.$elemMatch.color = {
        $regex: `^${escapeRegex(String(query.color))}$`,
        $options: 'i',
      };
    }
    filter.variants.$elemMatch.isActive = { $ne: false };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (Number(query.minPrice) >= 0) filter.price.$gte = Number(query.minPrice);
    if (Number(query.maxPrice) >= 0) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(String(query.q)), 'i');
    filter.$or = [{ name: rx }, { tags: rx }];
  }

  return filter;
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 12, maxLimit: 48 });
  const filter = await buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .select(LIST_FIELDS)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json(listResponse(docs.map(toListItem), page, limit, total));
});

export const featured = asyncHandler(async (req, res) => {
  const { limit } = getPagination(req.query, { defaultLimit: 8, maxLimit: 12 });
  const docs = await Product.find({ status: 'active', isFeatured: true })
    .select(LIST_FIELDS)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ items: docs.map(toListItem) });
});

export const newArrivals = asyncHandler(async (req, res) => {
  const { limit } = getPagination(req.query, { defaultLimit: 8, maxLimit: 12 });
  const docs = await Product.find({ status: 'active', isNewArrival: true })
    .select(LIST_FIELDS)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ items: docs.map(toListItem) });
});

export const bySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'active' }).populate(
    'category',
    'name slug parent metaTitle metaDescription'
  );

  if (!product) throw ApiError.notFound('Product not found');

  const relatedDocs = await Product.find({
    category: product.category._id,
    status: 'active',
    _id: { $ne: product._id },
  })
    .select(LIST_FIELDS)
    .populate('category', 'name slug')
    .sort({ soldCount: -1 })
    .limit(4)
    .lean();

  res.json({
    product,
    related: relatedDocs.map(toListItem),
  });
});
