import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Config from '../models/Config.js';
import { uniqueSlug } from '../utils/slug.js';
import { nextOrderNumber } from '../services/counterService.js';

const FORCE = process.argv.includes('--force');
const img = (seed) => `https://picsum.photos/seed/${seed}/800/800`;

const CATEGORIES = [
  { name: 'Sandals', sortOrder: 1, children: ['Peshawari Chappal', 'Kolhapuri'] },
  { name: 'Shoes', sortOrder: 2, children: ['Formal Shoes', 'Casual Shoes'] },
  { name: 'Slippers', sortOrder: 3, children: [] },
];

const PRODUCTS = [
  {
    name: 'Classic Peshawari Chappal - Black',
    cat: 'Peshawari Chappal',
    price: 2490,
    compare: 2990,
    colors: ['Black'],
    featured: true,
    isNew: true,
    tags: ['peshawari', 'chappal', 'leather'],
  },
  {
    name: 'Classic Peshawari Chappal - Tan',
    cat: 'Peshawari Chappal',
    price: 2490,
    compare: null,
    colors: ['Tan'],
    featured: false,
    isNew: true,
    tags: ['peshawari', 'chappal'],
  },
  {
    name: 'Sada Peshawari Chappal',
    cat: 'Peshawari Chappal',
    price: 1890,
    compare: 2290,
    colors: ['Brown', 'Black'],
    featured: true,
    isNew: false,
    tags: ['peshawari', 'casual'],
  },
  {
    name: 'Norozi Chappal - Handstitched',
    cat: 'Peshawari Chappal',
    price: 3490,
    compare: null,
    colors: ['Brown'],
    featured: false,
    isNew: true,
    tags: ['norozi', 'handmade'],
  },
  {
    name: 'Premium Kolhapuri Sandal',
    cat: 'Kolhapuri',
    price: 2190,
    compare: 2590,
    colors: ['Tan', 'Brown'],
    featured: true,
    isNew: false,
    tags: ['kolhapuri', 'sandals'],
  },
  {
    name: 'Kolhapuri Flip Flop',
    cat: 'Kolhapuri',
    price: 1490,
    compare: null,
    colors: ['Black'],
    featured: false,
    isNew: false,
    tags: ['kolhapuri', 'casual'],
  },
  {
    name: 'Leather Oxford Formal Shoe',
    cat: 'Formal Shoes',
    price: 5990,
    compare: 6990,
    colors: ['Black', 'Brown'],
    featured: true,
    isNew: true,
    tags: ['formal', 'oxford', 'leather'],
  },
  {
    name: 'Classic Derby Shoe',
    cat: 'Formal Shoes',
    price: 5490,
    compare: null,
    colors: ['Brown'],
    featured: false,
    isNew: false,
    tags: ['formal', 'derby'],
  },
  {
    name: 'Urban Casual Loafer',
    cat: 'Casual Shoes',
    price: 3990,
    compare: 4490,
    colors: ['Tan', 'Black'],
    featured: false,
    isNew: true,
    tags: ['casual', 'loafer'],
  },
  {
    name: 'Everyday Sneaker',
    cat: 'Casual Shoes',
    price: 3590,
    compare: null,
    colors: ['White', 'Black'],
    featured: true,
    isNew: false,
    tags: ['sneakers', 'casual'],
  },
  {
    name: 'Comfort House Slipper',
    cat: 'Slippers',
    price: 1290,
    compare: 1590,
    colors: ['Brown', 'Black'],
    featured: false,
    isNew: false,
    tags: ['slippers', 'home'],
  },
  {
    name: 'Leather Sandal - Summer',
    cat: 'Sandals',
    price: 1990,
    compare: null,
    colors: ['Tan'],
    featured: false,
    isNew: true,
    tags: ['sandals', 'summer'],
  },
];

const ALL_SIZES = ['39', '40', '41', '42', '43', '44', '45'];
const DEMO_PASSWORD = 'Admin@SIS2026';

async function seed() {
  await connectDB();

  const adminExists = await User.exists({ role: 'admin' });
  if (adminExists && !FORCE) {
    console.log('[seed] admin already exists — skipping (use --force to wipe & reseed)');
    await disconnectDB();
    return;
  }

  if (FORCE) {
    console.log('[seed] --force: wiping products, categories, orders, customers, counters...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({ role: 'customer' }),
      Config.deleteMany({}),
    ]);
    await mongoose.connection.db.collection('counters').deleteMany({});
  }

  console.log('[seed] admin...');
  const admin = await User.create({
    name: 'Store Admin',
    email: 'admin@sis.pk',
    phone: '03000000000',
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    role: 'admin',
  });

  console.log('[seed] config...');
  await Config.create({ key: 'store' });

  console.log('[seed] categories...');
  const catMap = {};
  for (const top of CATEGORIES) {
    const topDoc = await Category.create({
      name: top.name,
      slug: await uniqueSlug(Category, top.name),
      sortOrder: top.sortOrder,
      description: `${top.name} from SIS — handcrafted quality footwear.`,
      image: { url: img(`sis-cat-${top.name.toLowerCase()}`), alt: top.name },
    });
    catMap[top.name] = topDoc._id;

    for (let i = 0; i < top.children.length; i += 1) {
      const childName = top.children[i];

      const childDoc = await Category.create({
        name: childName,
        slug: await uniqueSlug(Category, childName),
        parent: topDoc._id,
        sortOrder: i + 1,
        description: `${childName} collection by SIS.`,
        image: {
          url: img(`sis-cat-${childName.toLowerCase().replace(/\s+/g, '-')}`),
          alt: childName,
        },
      });
      catMap[childName] = childDoc._id;
    }
  }

  console.log('[seed] products...');
  const productDocs = [];
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const p = PRODUCTS[i];
    const sizes = i % 3 === 0 ? ALL_SIZES : ALL_SIZES.slice(1, 6);
    const variants = [];
    for (const color of p.colors) {
      for (const size of sizes) {
        variants.push({
          size,
          color,
          sku: `SIS-${i + 1}-${size}-${color.toUpperCase()}`,
          stock: 5 + ((i * 3 + size) % 12),
        });
      }
    }

    const doc = await Product.create({
      name: p.name,
      slug: await uniqueSlug(Product, p.name),
      description: `${p.name} by SIS (Shahid Insaf Shoes). Premium quality, comfortable fit, and durable craftsmanship. Cash on delivery available all over Pakistan. Standard sizes 39-45.`,
      category: catMap[p.cat],
      tags: p.tags,
      price: p.price,
      compareAtPrice: p.compare,
      variants,
      images: [
        { url: img(`sis-prod-${i + 1}-a`), alt: `${p.name} - view 1`, isPrimary: true },
        { url: img(`sis-prod-${i + 1}-b`), alt: `${p.name} - view 2` },
        { url: img(`sis-prod-${i + 1}-c`), alt: `${p.name} - view 3` },
      ],
      status: 'active',
      isFeatured: p.featured,
      isNewArrival: p.isNew,
      soldCount: 0,
    });
    productDocs.push(doc);
  }

  console.log('[seed] demo orders...');
  const day = 24 * 60 * 60 * 1000;
  const demoStatuses = ['placed', 'confirmed', 'shipped', 'delivered'];
  for (let i = 0; i < demoStatuses.length; i += 1) {
    const status = demoStatuses[i];
    const product = productDocs[i];
    const variant = product.variants[0];
    const qty = i + 1;
    const subtotal = product.price * qty;
    const shipping = 250;
    const createdAt = new Date(Date.now() - (4 - i) * day);

    const history = [];
    const statusesUpTo = demoStatuses.slice(0, demoStatuses.indexOf(status) + 1);
    for (const s of statusesUpTo) {
      history.push({
        status: s,
        by: admin._id,
        at: createdAt,
        note: s === status ? 'Latest update' : '',
      });
    }

    await Order.create({
      orderNumber: await nextOrderNumber(),
      user: null,
      isGuest: true,
      customer: {
        name: ['Ali Khan', 'Sara Ahmed', 'Usman Tariq', 'Hina Raza'][i],
        phone: `030012345${String(i).padStart(2, '0')}`,
        email: '',
      },
      shippingAddress: {
        fullName: ['Ali Khan', 'Sara Ahmed', 'Usman Tariq', 'Hina Raza'][i],
        phone: `030012345${String(i).padStart(2, '0')}`,
        line1: `House ${i + 1}, Street ${i + 2}`,
        city: ['Lahore', 'Karachi', 'Islamabad', 'Peshawar'][i],
        province: ['Punjab', 'Sindh', 'Islamabad Capital', 'KPK'][i],
      },
      items: [
        {
          product: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images[0]?.url,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          price: product.price,
          qty,
          lineTotal: subtotal,
        },
      ],
      pricing: { subtotal, shippingCost: shipping, discount: 0, total: subtotal + shipping },
      payment: {
        method: 'cod',
        status: status === 'delivered' ? 'paid' : 'pending',
        paidAt: status === 'delivered' ? createdAt : undefined,
      },
      status,
      statusHistory: history,
      stockAdjusted: false,
      createdAt,
    });
  }

  console.log('');
  console.log('========== SEED COMPLETE ==========');
  console.log(`  Admin login : admin@sis.pk / ${DEMO_PASSWORD}`);
  console.log(`  Categories  : ${Object.keys(catMap).length}`);
  console.log(`  Products    : ${productDocs.length}`);
  console.log('  Demo orders : 4');
  console.log('===================================');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exit(1);
});
