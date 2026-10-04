import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { ApiError } from '../utils/apiError.js';
import { uniqueSlug, slugify } from '../utils/slug.js';

function skuList(variants = []) {
  return variants.map((v) => String(v.sku || '').trim()).filter(Boolean);
}

async function assertSkusFree(variants, excludeProductId = null) {
  const skus = skuList(variants);
  const dupes = skus.filter((s, i) => skus.indexOf(s) !== i);
  if (dupes.length) {
    throw ApiError.badRequest(`Duplicate SKU in variants: ${[...new Set(dupes)].join(', ')}`, {
      variants: `Duplicate SKU: ${[...new Set(dupes)][0]}`,
    });
  }
  if (!skus.length) return;
  const query = { 'variants.sku': { $in: skus } };
  if (excludeProductId) query._id = { $ne: excludeProductId };
  const clash = await Product.findOne(query).select('slug').lean();
  if (clash) {
    throw ApiError.conflict(`SKU already used by another product (${clash.slug})`, 'SKU_TAKEN', {
      variants: 'SKU already exists',
    });
  }
}

async function assertCategory(categoryId) {
  const category = await Category.findById(categoryId).select('_id name').lean();
  if (!category)
    throw ApiError.badRequest('Category not found', { category: 'Select a valid category' });
  return category;
}

function baseFields(data) {
  return {
    name: data.name,
    description: data.description || '',
    brand: data.brand || 'SIS',
    tags: data.tags || [],
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    images: (data.images || []).map((img) => ({
      url: img.url,
      publicId: img.publicId || '',
      alt: img.alt || '',
      isPrimary: !!img.isPrimary,
    })),
    status: data.status || 'draft',
    isFeatured: !!data.isFeatured,
    isNewArrival: !!data.isNewArrival,
    metaTitle: data.metaTitle || '',
    metaDescription: data.metaDescription || '',
  };
}

export async function createProduct(data) {
  await assertCategory(data.category);
  await assertSkusFree(data.variants);

  const slug = await uniqueSlug(Product, data.slug || data.name);
  return Product.create({
    ...baseFields(data),
    slug,
    category: data.category,
    variants: data.variants.map((v) => ({
      size: v.size,
      color: v.color,
      sku: String(v.sku || '').trim() || undefined,
      stock: v.stock ?? 0,
      priceOverride: v.priceOverride ?? undefined,
      isActive: v.isActive !== false,
    })),
  });
}

/**
 * Full update. Variants sync: present `_id` → update; no `_id` → add;
 * missing → remove, unless referenced by an order (then deactivate).
 */
export async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');

  await assertCategory(data.category);
  await assertSkusFree(data.variants, product._id);

  const incoming = data.variants || [];
  const incomingIds = new Set(incoming.filter((v) => v._id).map((v) => String(v._id)));
  const removedDocs = product.variants.filter((v) => !incomingIds.has(String(v._id)));

  const referenced = new Set();
  if (removedDocs.length) {
    // Orders snapshot items without variant._id (doc 03) — reference by product+size+color.
    const checks = await Promise.all(
      removedDocs.map((v) =>
        Order.exists({
          items: { $elemMatch: { product: product._id, size: v.size, color: v.color } },
        })
      )
    );
    removedDocs.forEach((v, i) => {
      if (checks[i]) referenced.add(String(v._id));
    });
  }

  const byId = new Map(incoming.filter((v) => v._id).map((v) => [String(v._id), v]));
  const finalVariants = [];
  let deactivated = 0;

  for (const doc of product.variants) {
    const sid = String(doc._id);
    const inc = byId.get(sid);
    if (inc) {
      doc.size = inc.size;
      doc.color = inc.color;
      doc.sku = String(inc.sku || '').trim() || doc.sku;
      doc.stock = inc.stock ?? 0;
      doc.priceOverride = inc.priceOverride ?? undefined;
      doc.isActive = inc.isActive !== false;
      finalVariants.push(doc);
      continue;
    }
    if (incomingIds.has(sid)) continue;
    if (referenced.has(sid)) {
      doc.isActive = false;
      finalVariants.push(doc);
      deactivated += 1;
    }
  }

  for (const v of incoming) {
    if (v._id) continue;
    finalVariants.push({
      size: v.size,
      color: v.color,
      sku: String(v.sku || '').trim() || undefined,
      stock: v.stock ?? 0,
      priceOverride: v.priceOverride ?? undefined,
      isActive: v.isActive !== false,
    });
  }

  const slugBase = data.slug || data.name;
  const slugifyBase = slugify(slugBase);
  product.slug =
    product.slug === slugifyBase ? product.slug : await uniqueSlug(Product, slugBase, product._id);

  const fields = baseFields(data);
  if (data.images === undefined) delete fields.images;
  Object.assign(product, fields, {
    category: data.category,
    variants: finalVariants,
  });

  await product.save();
  return { product, deactivated };
}

export async function findProduct(id) {
  const product = await Product.findById(id).populate('category', 'name slug').lean();
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}
