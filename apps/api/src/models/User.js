import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    verifyOtpHash: { type: String, select: false },
    verifyExpiresAt: { type: Date, select: false },
    verifyAttempts: { type: Number, default: 0, select: false },
    addresses: [addressSchema],
    lastLoginAt: Date,
    resetOtpHash: { type: String, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpiresAt: { type: Date, select: false },
    resetAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });
userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
export default User;
export { addressSchema };
