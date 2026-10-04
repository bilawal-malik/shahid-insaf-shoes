import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/apiError.js';
import env from '../config/env.js';
import { sendMail } from '../services/mailService.js';
import { contactTemplate } from '../services/mailTemplates.js';

export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  await ContactMessage.create({ name, email: email || '', phone: phone || '', message });

  // Admin notification (NOTIFY_EMAIL). Without it the send is recorded in
  // the dev outbox with reason "no recipient" so nothing disappears silently.
  void sendMail({
    to: env.mail.notify || null,
    ...contactTemplate({ name, email, phone, message }),
    meta: { kind: 'contact' },
  });

  res.status(201).json({ message: 'Thanks! We will get back to you soon.' });
});
