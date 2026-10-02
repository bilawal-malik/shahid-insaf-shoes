import { rateLimit } from 'express-rate-limit';

const message = (scope) => ({
  error: {
    message: `Too many ${scope} attempts. Please try again in a minute.`,
    code: 'RATE_LIMITED',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('login'),
});

export const registerLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('registration'),
});

export const orderLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('order'),
});

export const contactLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('contact form'),
});
