import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import ContactMessage from '../models/ContactMessage.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Config from '../models/Config.js';
import { uniqueSlug } from '../utils/slug.js';
import { nextOrderNumber } from '../services/counterService.js';

const FORCE = process.argv.includes('--force');

/** Verified image URLs (all checked live 2026-10): Unsplash + Pexels + Wikimedia. */
const U = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;
const P = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;
const W_PESHWARI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Peshawari_Chappal_Charsadda_Style.jpg/500px-Peshawari_Chappal_Charsadda_Style.jpg';
const W_SLIPPERS =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Slippers.jpg/500px-Slippers.jpg';

const IMG = {
  brogue: U('1449505278894-297fdb3edbc1'),
  chukka: U('1614252235316-8c857d38b5f4'),
  birk: U('1603487742131-4160ec999306'),
  boot: U('1520639888713-7851133b1ed0'),
  sneaker1: U('1562183241-b937e95585b6'),
  sneaker2: U('1491553895911-0055eca6402d'),
  sneaker3: U('1460353581641-37baddab0fa2'),
  sneaker4: U('1512374382149-233c42b6a83b'),
  sneaker5: U('1606107557195-0e29a4b5b4aa'),
  sneaker6: U('1549298916-b41d501d3772'),
  sneaker7: U('1542291026-7eec264c27ff'),
  sneaker8: U('1560769629-975ec94e6a86'),
  sneaker9: U('1608231387042-66d1773070a5'),
  sneaker10: U('1600185365483-26d7a4cc7519'),
  chappalPile: P('12024998'),
  khussaPile: P('34787523'),
  khussaColor: P('35056828'),
  tanSandals: P('23692992'),
  slidesWB: P('26925248'),
  slidesOlive: P('26925256'),
  blackSandals: P('26965812'),
  womenSandals: P('26954370'),
  girlsSandals: P('17740561'),
  pinkSlides: P('17740568'),
  blueRows: P('31291725'),
  loafers: P('267301'),
  brogueTan: P('12210270'),
  bootsDark: P('19750710'),
  shopHang: P('12186179'),
  marketStall: P('13643931'),
  shoeShop: P('20627531'),
  peshawari: W_PESHWARI,
  navySlippers: W_SLIPPERS,
};

const CATEGORIES = [
  {
    name: 'Sandals',
    sortOrder: 1,
    image: IMG.blueRows,
    children: [
      { name: 'Peshawari Chappal', image: IMG.chappalPile },
      { name: 'Kolhapuri', image: IMG.tanSandals },
    ],
  },
  {
    name: 'Shoes',
    sortOrder: 2,
    image: IMG.shopHang,
    children: [
      { name: 'Formal Shoes', image: IMG.brogueTan },
      { name: 'Casual Shoes', image: IMG.loafers },
    ],
  },
  { name: 'Slippers', sortOrder: 3, image: IMG.pinkSlides, children: [] },
];

const PRODUCTS = [
  // Peshawari Chappal (6)
  {
    name: 'Classic Peshawari Chappal - Black',
    cat: 'Peshawari Chappal',
    price: 2490,
    compare: 2990,
    colors: ['Black'],
    featured: true,
    isNew: true,
    sold: 142,
    tags: ['peshawari', 'chappal', 'leather'],
    blurb: 'Hand-stitched Norozi-style straps in full-grain black leather with a cushioned sole.',
    imgs: [IMG.peshawari, IMG.chappalPile, IMG.khussaColor],
  },
  {
    name: 'Classic Peshawari Chappal - Tan',
    cat: 'Peshawari Chappal',
    price: 2490,
    compare: null,
    colors: ['Tan'],
    featured: false,
    isNew: true,
    sold: 67,
    tags: ['peshawari', 'chappal'],
    blurb: 'Warm tan leather that ages beautifully — the everyday Peshawari classic.',
    imgs: [IMG.tanSandals, IMG.chappalPile, IMG.shoeShop],
  },
  {
    name: 'Sada Peshawari Chappal',
    cat: 'Peshawari Chappal',
    price: 1890,
    compare: 2290,
    colors: ['Brown', 'Black'],
    featured: false,
    isNew: false,
    sold: 98,
    tags: ['peshawari', 'casual'],
    blurb: 'The minimal everyday chappal — no embroidery, just clean leather and comfort.',
    imgs: [IMG.chappalPile, IMG.khussaPile, IMG.khussaColor],
  },
  {
    name: 'Norozi Chappal - Handstitched',
    cat: 'Peshawari Chappal',
    price: 3490,
    compare: null,
    colors: ['Brown'],
    featured: false,
    isNew: true,
    sold: 31,
    tags: ['norozi', 'handmade'],
    blurb: 'Premium handstitched Norozi with braided straps and a layered leather footbed.',
    imgs: [IMG.khussaPile, IMG.khussaColor, IMG.chappalPile],
  },
  {
    name: 'Amrood Peshawari Chappal',
    cat: 'Peshawari Chappal',
    price: 2790,
    compare: 3190,
    colors: ['Maroon', 'Black'],
    featured: false,
    isNew: true,
    sold: 24,
    tags: ['peshawari', 'amrood', 'handmade'],
    blurb: 'Distinctive amrood (fruit) cut-out pattern on rich maroon leather.',
    imgs: [IMG.khussaColor, IMG.chappalPile, IMG.khussaPile],
  },
  {
    name: 'Pakistani Khussa - Embroidered',
    cat: 'Peshawari Chappal',
    price: 2290,
    compare: 2790,
    colors: ['Gold', 'Brown'],
    featured: true,
    isNew: false,
    sold: 76,
    tags: ['khussa', 'embroidered', 'traditional'],
    blurb: 'Hand-embroidered khussa with metallic thread work — festive and traditional.',
    imgs: [IMG.khussaPile, IMG.khussaColor, IMG.shopHang],
  },

  // Kolhapuri (5)
  {
    name: 'Premium Kolhapuri Sandal',
    cat: 'Kolhapuri',
    price: 2190,
    compare: 2590,
    colors: ['Tan', 'Brown'],
    featured: true,
    isNew: false,
    sold: 119,
    tags: ['kolhapuri', 'sandals'],
    blurb: 'Braided Kolhapuri toe-loop in vegetable-tanned leather — breathable for summer.',
    imgs: [IMG.tanSandals, IMG.slidesWB, IMG.blackSandals],
  },
  {
    name: 'Kolhapuri Flip Flop',
    cat: 'Kolhapuri',
    price: 1490,
    compare: null,
    colors: ['Black'],
    featured: false,
    isNew: false,
    sold: 84,
    tags: ['kolhapuri', 'casual'],
    blurb: 'A light Kolhapuri-inspired flip flop with a moulded footbed for daily wear.',
    imgs: [IMG.blackSandals, IMG.slidesOlive, IMG.slidesWB],
  },
  {
    name: 'Kolhapuri Slip-On Sandal',
    cat: 'Kolhapuri',
    price: 1790,
    compare: 2090,
    colors: ['Brown'],
    featured: false,
    isNew: true,
    sold: 45,
    tags: ['kolhapuri', 'slip-on'],
    blurb: 'Easy slip-on with a woven vamp — smart enough for the office, comfy for home.',
    imgs: [IMG.slidesWB, IMG.slidesOlive, IMG.blackSandals],
  },
  {
    name: 'Kolhapuri Leather Slide',
    cat: 'Kolhapuri',
    price: 1990,
    compare: null,
    colors: ['Olive', 'Black'],
    featured: false,
    isNew: false,
    sold: 38,
    tags: ['kolhapuri', 'slide'],
    blurb: 'Two-strap leather slide with a cork-style footbed and stitched edges.',
    imgs: [IMG.slidesOlive, IMG.slidesWB, IMG.tanSandals],
  },
  {
    name: "Women's Kolhapuri Sandal",
    cat: 'Kolhapuri',
    price: 1690,
    compare: 1990,
    colors: ['White', 'Rose'],
    featured: false,
    isNew: true,
    sold: 52,
    tags: ['kolhapuri', 'women', 'sandals'],
    blurb: 'A lighter take on the Kolhapuri with a slim sole and padded straps.',
    imgs: [IMG.girlsSandals, IMG.womenSandals, IMG.birk],
  },

  // Formal Shoes (4)
  {
    name: 'Leather Oxford Formal Shoe',
    cat: 'Formal Shoes',
    price: 5990,
    compare: 6990,
    colors: ['Black', 'Brown'],
    featured: true,
    isNew: true,
    sold: 63,
    tags: ['formal', 'oxford', 'leather'],
    blurb: 'Closed-lace Oxford in polished full-grain leather with a stitched leather sole.',
    imgs: [IMG.brogue, IMG.chukka, IMG.brogueTan],
  },
  {
    name: 'Classic Derby Shoe',
    cat: 'Formal Shoes',
    price: 5490,
    compare: null,
    colors: ['Brown'],
    featured: false,
    isNew: false,
    sold: 41,
    tags: ['formal', 'derby'],
    blurb: 'Open-lace Derby with a rounded toe — the versatile wedding-and-office staple.',
    imgs: [IMG.brogueTan, IMG.brogue, IMG.chukka],
  },
  {
    name: 'Handcrafted Brogue',
    cat: 'Formal Shoes',
    price: 6490,
    compare: 7490,
    colors: ['Tan'],
    featured: false,
    isNew: false,
    sold: 27,
    tags: ['formal', 'brogue', 'handcrafted'],
    blurb: 'Full brogue detailing with wingtip perforations on burnished tan leather.',
    imgs: [IMG.brogue, IMG.brogueTan, IMG.boot],
  },
  {
    name: 'Suede Chukka Boot',
    cat: 'Formal Shoes',
    price: 5790,
    compare: null,
    colors: ['Brown', 'Navy'],
    featured: false,
    isNew: true,
    sold: 19,
    tags: ['chukka', 'suede', 'boot'],
    blurb: 'Two-eyelet chukka in soft suede — smart-casual from desk to dinner.',
    imgs: [IMG.chukka, IMG.boot, IMG.bootsDark],
  },

  // Casual Shoes (5)
  {
    name: 'Urban Casual Loafer',
    cat: 'Casual Shoes',
    price: 3990,
    compare: 4490,
    colors: ['Navy', 'Tan'],
    featured: true,
    isNew: true,
    sold: 88,
    tags: ['casual', 'loafer'],
    blurb: 'Driving-style loafer with a flexible sole and penny-bar detail.',
    imgs: [IMG.loafers, IMG.chukka, IMG.shopHang],
  },
  {
    name: 'Everyday Sneaker',
    cat: 'Casual Shoes',
    price: 3590,
    compare: null,
    colors: ['White', 'Black'],
    featured: true,
    isNew: false,
    sold: 134,
    tags: ['sneakers', 'casual'],
    blurb: 'Clean low-top sneaker with a cushioned insole — goes with everything.',
    imgs: [IMG.sneaker1, IMG.sneaker2, IMG.sneaker3],
  },
  {
    name: 'Canvas Slip-On Sneaker',
    cat: 'Casual Shoes',
    price: 2990,
    compare: 3490,
    colors: ['Grey', 'Navy'],
    featured: false,
    isNew: false,
    sold: 72,
    tags: ['sneakers', 'slip-on'],
    blurb: 'Lightweight canvas upper with elastic gussets — on and off in a second.',
    imgs: [IMG.sneaker4, IMG.sneaker5, IMG.sneaker6],
  },
  {
    name: 'Runner Sneaker',
    cat: 'Casual Shoes',
    price: 4590,
    compare: 5290,
    colors: ['Black', 'Red'],
    featured: false,
    isNew: true,
    sold: 56,
    tags: ['sneakers', 'running'],
    blurb: 'Breathable mesh runner with a shock-absorbing midsole for all-day wear.',
    imgs: [IMG.sneaker7, IMG.sneaker8, IMG.sneaker9],
  },
  {
    name: 'Trail Boot',
    cat: 'Casual Shoes',
    price: 5290,
    compare: null,
    colors: ['Brown', 'Olive'],
    featured: false,
    isNew: false,
    sold: 33,
    tags: ['boots', 'trail'],
    blurb: 'Rugged lug-sole boot with a padded collar — built for hill roads and winter.',
    imgs: [IMG.boot, IMG.bootsDark, IMG.chukka],
  },

  // Slippers (4)
  {
    name: 'Comfort House Slipper',
    cat: 'Slippers',
    price: 1290,
    compare: 1590,
    colors: ['Navy', 'Black'],
    featured: true,
    isNew: false,
    sold: 151,
    tags: ['slippers', 'home'],
    blurb: 'Closed-toe house slipper with a soft fleece lining and anti-slip sole.',
    imgs: [IMG.navySlippers, IMG.pinkSlides, IMG.slidesWB],
  },
  {
    name: 'Fleece Home Slipper',
    cat: 'Slippers',
    price: 1490,
    compare: null,
    colors: ['Rose', 'Grey'],
    featured: false,
    isNew: true,
    sold: 64,
    tags: ['slippers', 'fleece'],
    blurb: 'Plush fleece upper that keeps toes warm through winter nights.',
    imgs: [IMG.pinkSlides, IMG.navySlippers, IMG.slidesOlive],
  },
  {
    name: 'Summer House Slipper',
    cat: 'Slippers',
    price: 990,
    compare: 1290,
    colors: ['Blue', 'Black'],
    featured: false,
    isNew: false,
    sold: 97,
    tags: ['slippers', 'summer'],
    blurb: 'Open, airy slide for hot days — quick-dry straps and a feather-light sole.',
    imgs: [IMG.slidesWB, IMG.pinkSlides, IMG.slidesOlive],
  },
  {
    name: 'Memory Foam Slipper',
    cat: 'Slippers',
    price: 1890,
    compare: 2190,
    colors: ['Charcoal'],
    featured: false,
    isNew: true,
    sold: 42,
    tags: ['slippers', 'memory-foam'],
    blurb: 'Orthopedic memory-foam footbed that shapes to your arch with every step.',
    imgs: [IMG.pinkSlides, IMG.navySlippers, IMG.womenSandals],
  },
];

const ALL_SIZES = ['39', '40', '41', '42', '43', '44', '45'];
const DEMO_PASSWORD = 'Admin@SIS2026';
const CUSTOMER_PASSWORD = 'Demo@1234';

const CUSTOMERS = [
  {
    name: 'Ali Khan',
    email: 'ali@example.com',
    phone: '03001234567',
    city: 'Lahore',
    province: 'Punjab',
    line1: 'House 12, Block C, Gulberg III',
  },
  {
    name: 'Sara Ahmed',
    email: 'sara@example.com',
    phone: '03011234567',
    city: 'Karachi',
    province: 'Sindh',
    line1: 'Flat 4B, Clifton Block 5',
  },
  {
    name: 'Usman Tariq',
    email: 'usman@example.com',
    phone: '03021234567',
    city: 'Islamabad',
    province: 'Islamabad Capital',
    line1: 'Street 34, F-8 Markaz',
  },
  {
    name: 'Hina Raza',
    email: 'hina@example.com',
    phone: '03031234567',
    city: 'Peshawar',
    province: 'KPK',
    line1: 'House 7, University Road',
  },
  {
    name: 'Fatima Noor',
    email: 'fatima@example.com',
    phone: '03041234567',
    city: 'Faisalabad',
    province: 'Punjab',
    line1: 'Plot 21, Madina Town',
  },
];

const HISTORY_PATH = {
  placed: ['placed'],
  confirmed: ['placed', 'confirmed'],
  shipped: ['placed', 'confirmed', 'shipped'],
  delivered: ['placed', 'confirmed', 'shipped', 'delivered'],
  cancelled: ['placed', 'cancelled'],
  returned: ['placed', 'confirmed', 'shipped', 'returned'],
};

async function seed() {
  await connectDB();

  const adminExists = await User.exists({ role: 'admin' });
  if (adminExists && !FORCE) {
    console.log('[seed] admin already exists — skipping (use --force to wipe & reseed)');
    await disconnectDB();
    return;
  }

  if (FORCE) {
    console.log('[seed] --force: wiping products, categories, orders, users, counters...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      Config.deleteMany({}),
      ContactMessage.deleteMany({}),
    ]);
    await mongoose.connection.db.collection('counters').deleteMany({});
  }

  console.log('[seed] admins...');
  const ADMINS = [
    { name: 'Store Admin', email: 'admin@sis.pk', phone: '03000000000', password: DEMO_PASSWORD },
    { name: 'Bilawal', email: 'bilawal@gmail.com', phone: '03000000001', password: 'Bilawal' },
    { name: 'Shahid', email: 'shahid@gmail.com', phone: '03000000002', password: 'Shahid321' },
  ];
  const adminHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const a of ADMINS) {
    await User.create({
      name: a.name,
      email: a.email,
      phone: a.phone,
      password: a.password === DEMO_PASSWORD ? adminHash : await bcrypt.hash(a.password, 10),
      role: 'admin',
      emailVerified: true,
    });
  }
  const admin = await User.findOne({ email: 'admin@sis.pk' });

  console.log('[seed] config...');
  await Config.create({ key: 'store', store: { phone: '03029775416' } });

  console.log('[seed] categories...');
  const catMap = {};
  for (let ci = 0; ci < CATEGORIES.length; ci += 1) {
    const top = CATEGORIES[ci];
    const topDoc = await Category.create({
      name: top.name,
      slug: await uniqueSlug(Category, top.name),
      sortOrder: top.sortOrder,
      description: `${top.name} from SIS — handcrafted quality footwear.`,
      image: { url: top.image, alt: top.name },
    });
    catMap[top.name] = topDoc._id;

    for (let i = 0; i < top.children.length; i += 1) {
      const child = top.children[i];
      const childDoc = await Category.create({
        name: child.name,
        slug: await uniqueSlug(Category, child.name),
        parent: topDoc._id,
        sortOrder: i + 1,
        description: `${child.name} collection by SIS.`,
        image: { url: child.image, alt: child.name },
      });
      catMap[child.name] = childDoc._id;
    }
  }

  console.log('[seed] customers...');
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);
  const customerDocs = [];
  for (const c of CUSTOMERS) {
    const doc = await User.create({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: customerHash,
      role: 'customer',
      emailVerified: true,
      addresses: [
        {
          label: 'Home',
          fullName: c.name,
          phone: c.phone,
          line1: c.line1,
          city: c.city,
          province: c.province,
          isDefault: true,
        },
      ],
      lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
    customerDocs.push(doc);
  }

  console.log('[seed] products...');
  const productDocs = [];
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const p = PRODUCTS[i];
    const sizes = i % 4 === 0 ? ALL_SIZES : ALL_SIZES.slice(1, 6);
    const variants = [];
    for (const color of p.colors) {
      for (const size of sizes) {
        variants.push({
          size,
          color,
          sku: `SIS-${String(i + 1).padStart(3, '0')}-${size}-${color.toUpperCase().replace(/\s+/g, '')}`,
          stock: 5 + ((i * 3 + Number(size)) % 12),
        });
      }
    }

    const doc = await Product.create({
      name: p.name,
      slug: await uniqueSlug(Product, p.name),
      description: `${p.blurb} Sold by SIS (Shahid Insaf Shoes) — premium quality, comfortable fit, and durable craftsmanship. Cash on delivery available all over Pakistan. Standard sizes 39-45.`,
      category: catMap[p.cat],
      tags: p.tags,
      price: p.price,
      compareAtPrice: p.compare,
      variants,
      images: p.imgs.map((url, idx) => ({
        url,
        alt: `${p.name} - view ${idx + 1}`,
        isPrimary: idx === 0,
      })),
      status: 'active',
      isFeatured: p.featured,
      isNewArrival: p.isNew,
      soldCount: p.sold,
    });
    productDocs.push(doc);
  }

  console.log('[seed] demo orders...');
  const day = 24 * 60 * 60 * 1000;
  const byName = (name) => productDocs.find((d) => d.name === name);

  const ORDERS = [
    // guest orders (4)
    {
      guest: true,
      customerName: 'Bilal Akhtar',
      phone: '03009876501',
      city: 'Lahore',
      province: 'Punjab',
      line1: 'House 5, Model Town Link Road',
      status: 'placed',
      daysAgo: 1,
      lines: [['Classic Peshawari Chappal - Black', '42', 'Black', 1]],
    },
    {
      guest: true,
      customerName: 'Nadia Shah',
      phone: '03009876502',
      city: 'Karachi',
      province: 'Sindh',
      line1: 'Flat 12, PECHS Block 2',
      status: 'confirmed',
      daysAgo: 3,
      lines: [
        ['Premium Kolhapuri Sandal', '38', 'Tan', 1],
        ['Summer House Slipper', '38', 'Blue', 1],
      ],
    },
    {
      guest: true,
      customerName: 'Kamran Aslam',
      phone: '03009876503',
      city: 'Rawalpindi',
      province: 'Punjab',
      line1: 'Street 8, Satellite Town',
      status: 'shipped',
      daysAgo: 6,
      lines: [['Leather Oxford Formal Shoe', '43', 'Black', 1]],
    },
    {
      guest: true,
      customerName: 'Ayesha Malik',
      phone: '03009876504',
      city: 'Multan',
      province: 'Punjab',
      line1: 'Plot 3, Gulgasht Colony',
      status: 'delivered',
      daysAgo: 12,
      lines: [
        ['Comfort House Slipper', '40', 'Navy', 2],
        ['Fleece Home Slipper', '40', 'Rose', 1],
      ],
    },
    // customer orders (8) — indices refer to CUSTOMERS
    {
      customerIdx: 0,
      status: 'delivered',
      daysAgo: 18,
      lines: [
        ['Classic Peshawari Chappal - Tan', '42', 'Tan', 1],
        ['Pakistani Khussa - Embroidered', '42', 'Gold', 1],
        ['Everyday Sneaker', '42', 'White', 1],
      ],
    },
    {
      customerIdx: 0,
      status: 'placed',
      daysAgo: 1,
      lines: [['Suede Chukka Boot', '42', 'Brown', 1]],
    },
    {
      customerIdx: 1,
      status: 'shipped',
      daysAgo: 5,
      lines: [
        ["Women's Kolhapuri Sandal", '37', 'White', 1],
        ['Urban Casual Loafer', '37', 'Navy', 1],
        ['Memory Foam Slipper', '37', 'Charcoal', 1],
      ],
    },
    {
      customerIdx: 1,
      status: 'cancelled',
      daysAgo: 9,
      lines: [['Runner Sneaker', '37', 'Black', 1]],
      cancelReason: 'Customer changed size preference',
    },
    {
      customerIdx: 2,
      status: 'confirmed',
      daysAgo: 2,
      lines: [
        ['Handcrafted Brogue', '44', 'Tan', 1],
        ['Trail Boot', '44', 'Brown', 1],
      ],
    },
    {
      customerIdx: 2,
      status: 'returned',
      daysAgo: 14,
      lines: [['Canvas Slip-On Sneaker', '44', 'Grey', 1]],
    },
    {
      customerIdx: 3,
      status: 'delivered',
      daysAgo: 16,
      lines: [
        ['Sada Peshawari Chappal', '39', 'Brown', 1],
        ['Kolhapuri Flip Flop', '39', 'Black', 1],
      ],
    },
    {
      customerIdx: 4,
      status: 'placed',
      daysAgo: 1,
      lines: [
        ['Norozi Chappal - Handstitched', '41', 'Brown', 1],
        ['Amrood Peshawari Chappal', '41', 'Maroon', 1],
      ],
    },
  ];

  for (const o of ORDERS) {
    const createdAt = new Date(Date.now() - o.daysAgo * day);
    const items = o.lines.map(([name, size, color, qty]) => {
      const product = byName(name);
      const variant =
        product.variants.find((v) => v.size === size && v.color === color) || product.variants[0];
      return {
        product: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        price: product.price,
        qty,
        lineTotal: product.price * qty,
      };
    });

    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const shipping = subtotal >= 5000 ? 0 : 250;

    const history = HISTORY_PATH[o.status].map((s) => ({
      status: s,
      by: admin._id,
      at: createdAt,
      note: s === o.status ? 'Latest update' : '',
    }));

    const customer = o.guest
      ? { name: o.customerName, phone: o.phone, email: '' }
      : {
          name: CUSTOMERS[o.customerIdx].name,
          phone: CUSTOMERS[o.customerIdx].phone,
          email: CUSTOMERS[o.customerIdx].email,
        };
    const addr = o.guest
      ? { name: o.customerName, phone: o.phone, city: o.city, province: o.province, line1: o.line1 }
      : {
          name: CUSTOMERS[o.customerIdx].name,
          phone: CUSTOMERS[o.customerIdx].phone,
          city: CUSTOMERS[o.customerIdx].city,
          province: CUSTOMERS[o.customerIdx].province,
          line1: CUSTOMERS[o.customerIdx].line1,
        };

    const delivered = o.status === 'delivered';
    const future = new Date(Date.now() + 3 * day);

    await Order.create({
      orderNumber: await nextOrderNumber(),
      user: o.guest ? null : customerDocs[o.customerIdx]._id,
      isGuest: Boolean(o.guest),
      customer,
      shippingAddress: {
        fullName: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        city: addr.city,
        province: addr.province,
      },
      items,
      pricing: { subtotal, shippingCost: shipping, discount: 0, total: subtotal + shipping },
      payment: {
        method: 'cod',
        status: delivered ? 'paid' : 'pending',
        paidAt: delivered ? createdAt : undefined,
      },
      status: o.status,
      statusHistory: history,
      estimatedDelivery: ['placed', 'confirmed'].includes(o.status) ? future : undefined,
      cancelledAt: o.status === 'cancelled' ? createdAt : undefined,
      cancelReason: o.cancelReason,
      stockAdjusted: false,
      createdAt,
    });
  }

  console.log('');
  console.log('========== SEED COMPLETE ==========');
  console.log(`  Admin login    : admin@sis.pk / ${DEMO_PASSWORD}`);
  console.log(`  Customer logins: 5 accounts / ${CUSTOMER_PASSWORD} (e.g. ali@example.com)`);
  console.log(`  Categories     : ${Object.keys(catMap).length}`);
  console.log(`  Products       : ${productDocs.length}`);
  console.log(`  Orders         : ${ORDERS.length}`);
  console.log('===================================');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] FAILED:', err);
  process.exit(1);
});
