import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';

export const tree = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const nodes = new Map(
    categories.map((c) => [
      c._id.toString(),
      { ...c, productCount: countMap.get(c._id.toString()) || 0, children: [] },
    ])
  );

  const roots = [];
  for (const node of nodes.values()) {
    const parentId = node.parent?.toString();
    if (parentId && nodes.has(parentId)) nodes.get(parentId).children.push(node);
    else roots.push(node);
  }

  const assignCounts = (node) => {
    let total = countMap.get(node._id.toString()) || 0;
    for (const child of node.children) total += assignCounts(child);
    node.productCount = total;
    return total;
  };
  for (const root of roots) assignCounts(root);

  res.json({ items: roots });
});

export const bySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found');

  const breadcrumb = [];
  let current = category;
  let guard = 0;
  while (current && guard < 10) {
    breadcrumb.unshift({ _id: current._id, name: current.name, slug: current.slug });
    if (!current.parent) break;

    current = await Category.findById(current.parent).lean();
    guard += 1;
  }

  const children = await Category.find({ parent: category._id, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select('name slug image')
    .lean();

  res.json({ category, breadcrumb, children });
});
