import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/apiError.js';

export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  await ContactMessage.create({ name, email: email || '', phone: phone || '', message });
  res.status(201).json({ message: 'Thanks! We will get back to you soon.' });
});
