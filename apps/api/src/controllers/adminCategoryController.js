import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { uniqueSlug, slugify } from '../utils/slug.js';

export const list = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ parent: 1, sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$category', n: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({
    items: categories.map((c) => ({
      ...c,
      productCount: countMap.get(String(c._id)) || 0,
      childCount: categories.filter((x) => String(x.parent) === String(c._id)).length,
    })),
  });
});

async function assertParent(parentId, selfId = null) {
  if (!parentId) return null;
  const parent = await Category.findById(parentId).select('_id name parent').lean();
  if (!parent)
    throw ApiError.badRequest('Parent category not found', { parent: 'Select a valid parent' });
  if (selfId && String(parent._id) === String(selfId)) {
    throw ApiError.badRequest('A category cannot be its own parent', {
      parent: 'Cannot be its own parent',
    });
  }
  return parent;
}

/** Walks up the tree; returns true if `candidateParentId` leads back to `categoryId`. */
async function hasCycle(categoryId, candidateParentId) {
  let cursor = candidateParentId;
  const seen = new Set();
  while (cursor) {
    if (String(cursor) === String(categoryId)) return true;
    if (seen.has(String(cursor))) return true;
    seen.add(String(cursor));
    const node = await Category.findById(cursor).select('parent').lean();
    cursor = node?.parent || null;
  }
  return false;
}

export const create = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    parent,
    description,
    image,
    sortOrder,
    isActive,
    metaTitle,
    metaDescription,
  } = req.body;

  await assertParent(parent);

  const finalSlug = await uniqueSlug(Category, slug || name);
  const category = await Category.create({
    name,
    slug: finalSlug,
    parent: parent || null,
    description: description || '',
    image: {
      url: image?.url || '',
      alt: image?.alt || '',
      publicId: image?.publicId || '',
    },
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive !== false,
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
  });

  res.status(201).json({ category });
});

export const update = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const {
    name,
    slug,
    parent,
    description,
    image,
    sortOrder,
    isActive,
    metaTitle,
    metaDescription,
  } = req.body;

  const nextParent = parent || null;
  if (String(nextParent || '') === String(category._id)) {
    throw ApiError.badRequest('A category cannot be its own parent', {
      parent: 'Cannot be its own parent',
    });
  }
  if (nextParent && String(nextParent) !== String(category.parent || '')) {
    if (await hasCycle(category._id, nextParent)) {
      throw ApiError.conflict('That parent would create a cycle', 'CYCLE', {
        parent: 'Cannot move under its own descendant',
      });
    }
    await assertParent(nextParent);
  }

  const slugChanged = slug && slugify(slug) !== category.slug;
  if (slugChanged) category.slug = await uniqueSlug(Category, slug, category._id);

  category.name = name ?? category.name;
  category.parent = nextParent;
  category.description = description ?? category.description;
  category.sortOrder = Number(sortOrder) || 0;
  if (isActive !== undefined) category.isActive = !!isActive;
  category.metaTitle = metaTitle ?? category.metaTitle;
  category.metaDescription = metaDescription ?? category.metaDescription;
  if (image) {
    category.image = {
      url: image.url || '',
      alt: image.alt || '',
      publicId: image.publicId || '',
    };
  }

  await category.save();
  res.json({ category });
});

export const remove = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const [children, products] = await Promise.all([
    Category.countDocuments({ parent: category._id }),
    Product.countDocuments({ category: category._id }),
  ]);

  if (children > 0) {
    throw ApiError.conflict(
      `Category has ${children} subcategor${children === 1 ? 'y' : 'ies'}`,
      'HAS_CHILDREN'
    );
  }
  if (products > 0) {
    throw ApiError.conflict(
      `Category has ${products} product${products === 1 ? '' : 's'} — reassign or archive them first`,
      'HAS_PRODUCTS'
    );
  }

  await category.deleteOne();
  res.json({ ok: true });
});
