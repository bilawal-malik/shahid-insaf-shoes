import mongoose from 'mongoose';

const configSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'store' },

    store: {
      name: { type: String, default: 'SIS - Shahid Insaf Shoes' },
      tagline: { type: String, default: 'Handcrafted sandals, Peshawari chappals & shoes' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      social: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' },
      },
    },

    shipping: {
      flatRate: { type: Number, default: 250, min: 0 },
      freeAbove: { type: Number, default: 0, min: 0 },
      codEnabled: { type: Boolean, default: true },
      estimatedDays: { type: String, default: '3-5' },
    },

    checkout: {
      allowGuest: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 5, min: 0 },
    },

    announcement: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const Config = mongoose.model('Config', configSchema);
export default Config;
