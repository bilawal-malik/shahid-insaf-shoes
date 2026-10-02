import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    sku: { type: String, unique: true, sparse: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    priceOverride: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String, default: 'SIS' },
    tags: [{ type: String, trim: true }],

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'PKR' },

    variants: [variantSchema],
    images: [imageSchema],

    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    soldCount: { type: Number, default: 0 },

    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ status: 1, isNewArrival: 1 });
productSchema.index({ status: 1, price: 1 });
productSchema.index({ status: 1, soldCount: -1 });
productSchema.index(
  { name: 'text', tags: 'text', description: 'text' },
  { weights: { name: 5, tags: 3, description: 1 } }
);

productSchema.virtual('totalStock').get(function () {
  return (this.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
});

export function primaryImage(product) {
  const images = product.images || [];
  return images.find((i) => i.isPrimary) || images[0] || null;
}

const Product = mongoose.model('Product', productSchema);
export default Product;
